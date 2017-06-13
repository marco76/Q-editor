import { inject, LogManager } from 'aurelia-framework';
import { Container } from 'aurelia-dependency-injection';
import User from 'resources/User.js';
import qEnv from 'resources/qEnv.js';

const log = LogManager.getLogger('Q');

@inject(User, Container)
export default class ToolsInfo {

  constructor(user, diContainer) {
    this.user = user;
    this.diContainer = diContainer;
    this.availableTools = this.loadAvailableTools();
  }

  async loadAvailableTools() {
    let availableTools = [];

    await this.user.loaded;
    const QServerBaseUrl = await qEnv.QServerBaseUrl;

    const response = await fetch(`${QServerBaseUrl}/editor/tools`);
    if (!response.ok) {
      throw response;
    }

    const tools = await response.json();
    for (let tool of tools) {
      if (await this.isToolAvailable(tool)) {
        availableTools.push(tool);
      }
    }

    return availableTools;
  }

  async isToolAvailable(tool) {
    let isAvailable = true;
    if (tool.onlyRoles) {
      log.info('DEPRECATION NOTICE: tool.onlyRoles handling will be removed in Q editor 2.0. Use tool.availabilityChecks instead.');
      isAvailable = false;
      if (this.user && this.user.roles) {
        for (let role of tool.onlyRoles) {
          if (this.user.roles.indexOf(role) >= 0) {
            isAvailable = true;
          }
        }
      }
    }
    if (Array.isArray(tool.availabilityChecks)) {
      for (let availabilityCheck of tool.availabilityChecks) {
        let checker = this.diContainer.get(availabilityCheck.type + 'AvailabilityCheck');
        const available = await checker.isAvailable(availabilityCheck);
        if (!available) {
          return false;
        }
      }
    }
    return isAvailable;
  }

  getAvailableTools() {
    return this.availableTools;
  }

  async isToolWithNameAvailable(toolName) {
    const availableToolsNames = await this.getAvailableToolsNames();
    return availableToolsNames.includes(toolName);
  }

  async getAvailableToolsNames() {
    const tools = await this.getAvailableTools();
    return tools
      .map(tool => tool.name);
  }
}
