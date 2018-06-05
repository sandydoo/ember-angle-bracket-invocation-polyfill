/* globals Ember */
/* eslint-disable ember/new-module-imports */
import { gte } from 'ember-compatibility-helpers';

// Based heavily on https://github.com/mmun/ember-component-attributes
(function() {
  const { Application, Component, computed, getOwner } = Ember;

  if (gte('3.2.0-beta.1')) {
    const P = Ember.__loader.require('container').privatize;
    Application.reopenClass({
      buildRegistry() {
        let registry = this._super(...arguments);
        let TemplateCompiler = registry.resolve(P`template-compiler:main`);
        let originalCreate = TemplateCompiler.create;

        TemplateCompiler.create = function(options) {
          let owner = getOwner(options);
          let compiler = originalCreate(...arguments);
          let compileTimeLookup = compiler.resolver;
          let runtimeResolver = compileTimeLookup.resolver;

          return compiler;
        };

        return registry;
      },
    });
  }

  Component.reopen({
    __ANGLE_ATTRS__: computed({
      set(key, value) {
        let { invocationAttributes, attrSplat } = value;

        let combinedAttributes = Ember.assign({}, invocationAttributes, attrSplat);

        if (this.tagName === '') {
          return combinedAttributes;
        }

        let attributes = Object.keys(combinedAttributes);
        let attributeBindingsOverride = [];

        for (let i = 0; i < attributes.length; i++) {
          let attribute = attributes[i];

          attributeBindingsOverride.push(`__ANGLE_ATTRS__.${attribute}:${attribute}`);
        }

        if (this.attributeBindings) {
          let attributeBindings = this.attributeBindings.filter(microsyntax => {
            // See https://github.com/emberjs/ember.js/blob/6a6f279df3b1a0979b5fd000bf49cd775c720f01/packages/ember-glimmer/lib/utils/bindings.js#L59-L73
            let colonIndex = microsyntax.indexOf(':');
            let attribute = colonIndex === -1 ? microsyntax : microsyntax.substring(colonIndex + 1);

            return attributes.indexOf(attribute) === -1;
          });

          this.attributeBindings = attributeBindingsOverride.concat(attributeBindings);
        } else {
          this.attributeBindings = attributeBindingsOverride;
        }

        return combinedAttributes;
      },
    }),
  });
})();
