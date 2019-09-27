import { bindable, inject, Loader, LogManager } from "aurelia-framework";
import QConfig from "resources/QConfig";
import { isRequired } from "./helpers.js";

const log = LogManager.getLogger("Q");

@inject(QConfig, Loader)
export class SchemaEditorCode {
  @bindable
  schema;
  @bindable
  data;
  @bindable
  change;
  @bindable
  showNotifications;

  options = {};

  constructor(qConfig, loader) {
    this.qConfig = qConfig;
    this.loader = loader;
    this.isRequired = isRequired;
  }

  async schemaChanged() {
    this.applyOptions();
  }

  applyOptions() {
    if (!this.schema) {
      return;
    }
    if (this.schema.hasOwnProperty("Q:options")) {
      this.options = Object.assign(this.options, this.schema["Q:options"]);
    }
  }

  async attached() {
    this.showLoadingError = false;

    if (!window.CodeMirror) {
      try {
        window.CodeMirror = await this.loader.loadModule("codemirror");
        await Promise.all([
          this.loader.loadModule("npm:codemirror@5.49.0/lib/codemirror.css!"),
          this.loader.loadModule(
            "npm:codemirror@5.49.0/mode/javascript/javascript.js"
          ),
          this.loader.loadModule(
            "npm:codemirror@5.49.0/mode/htmlmixed/htmlmixed.js"
          ),
          this.loader.loadModule("npm:codemirror@5.49.0/mode/jinja2/jinja2.js"),
          this.loader.loadModule("npm:codemirror@5.49.0/mode/css/css.js")
        ]);
      } catch (e) {
        log.error(e);
      }
    }
    if (!window.CodeMirror) {
      log.error("window.Codemirror is not defined after loading codemirror");
      this.showLoadingError = true;
      return;
    }

    this.codeMirror = window.CodeMirror.fromTextArea(this.textareaElement, {
      mode: this.options.mode || this.options.mimeType,
      lineNumbers: true,
      tabSize: 2,
      lineWrapping: true
    });
    this.codeMirror.on("change", (codeMirror, change) => {
      this.data = this.codeMirror.getValue();
      this.change();
    });
  }
}
