import IsNil from 'lodash-es/isNil';
import Merge from 'lodash-es/merge';

import {PluginOption} from '@radon-extension/framework/Models/Configuration/Options';


export default class LoggerLevelOption extends PluginOption {
    constructor(plugin, key, options) {
        super(plugin, 'logger.level', key, Merge({
            componentId: 'services.configuration:logger.level',

            default: {
                levels: {
                    [null]: 'warning'
                },
                mode: 'basic'
            }
        }, options));
    }

    get() {
        return this.preferences.getObject(this.name);
    }

    isValid(value) {
        if(IsNil(value)) {
            return true;
        }

        if(IsNil(value.mode) || ['basic', 'advanced'].indexOf(value.mode) < 0) {
            return false;
        }

        if(IsNil(value.levels) || Object.keys(value.levels) < 1) {
            return false;
        }

        return true;
    }
}
