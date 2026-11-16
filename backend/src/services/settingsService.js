const { OrganizationSetting } = require('../models');

/**
 * Service for Organization Settings
 */
class SettingsService {
  /**
   * Get settings for the authenticated organization
   */
  static async getSettings(organizationId) {
    let [setting] = await OrganizationSetting.findOrCreate({
      where: { organization_id: organizationId },
      defaults: {
        organization_id: organizationId,
        default_low_stock_threshold: 5
      }
    });

    return setting;
  }

  /**
   * Update settings for the authenticated organization
   */
  static async updateSettings(organizationId, updateData) {
    let setting = await OrganizationSetting.findOne({
      where: { organization_id: organizationId }
    });

    if (!setting) {
      setting = await OrganizationSetting.create({
        organization_id: organizationId,
        default_low_stock_threshold: 5
      });
    }

    if (updateData.default_low_stock_threshold !== undefined) {
      await setting.update({
        default_low_stock_threshold: parseInt(updateData.default_low_stock_threshold, 10)
      });
    }

    return setting;
  }
}

module.exports = SettingsService;
