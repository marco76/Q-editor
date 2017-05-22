import SchemaEditorInputAvailabilityChecker from 'resources/SchemaEditorInputAvailabilityChecker.js';

export function checkAvailability() {
  return function(target) {
    // store any already existing inject property to concat it with the Element we want injected
    let inject = [];
    if (target.prototype.inject) {
      inject = target.prototype.inject;
    }

    return class extends target {
      static inject = [Element, SchemaEditorInputAvailabilityChecker].concat(inject);
      constructor(elem, schemaEditorInputAvailabilityChecker, ...rest) {
        super(...rest);
        this.__element__ = elem;
        this.__schemaEditorInputAvailabilityChecker__ = schemaEditorInputAvailabilityChecker;
        this.__inputElements__ = this.__element__.querySelectorAll('input, textarea, select, button');
      }

      bind(bindingContext, overrideContext) {
        if (super.bind) {
          super.bind(bindingContext, overrideContext);
        }

        this.__reevaluateCallbackId__ = this.__schemaEditorInputAvailabilityChecker__.registerReevaluateCallback(async () => {
          this.__checkAvailability__();
        });

        this.__checkAvailability__();
      }

      unbind() {
        if (super.unbind) {
          super.unbind();
        }
        this.__schemaEditorInputAvailabilityChecker__.unregisterReevaluateCallback(this.__reevaluateCallbackId__);
      }

      async __checkAvailability__() {
        this.__element__.classList.add('disabled');
        for (let inputElement of this.__inputElements__) {
          inputElement.disabled = true;
        }
        let isAvailable = await this.__schemaEditorInputAvailabilityChecker__.isAvailable(this.schema);
        if (isAvailable) {
          this.__element__.style.display = 'block';
          this.__element__.classList.remove('disabled');
          for (let inputElement of this.__inputElements__) {
            inputElement.disabled = false;
          }
        } else {
          this.__element__.style.display = 'none';
        }
      }
    };
  };
}
