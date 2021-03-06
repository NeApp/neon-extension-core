import ForEach from 'lodash-es/forEach';
import IsNil from 'lodash-es/isNil';

import Log from '@radon-extension/framework/Core/Logger';


export default class MigrateService {
    constructor() {
        // Migrate preference/storage keys
        this.migrateKeys();
    }

    migrateKeys() {
        let keys = Object.keys(localStorage);

        ForEach(keys, (key) => {
            try {
                // Migrate preference/storage key
                if(key.startsWith('preferences:eon.extension')) {
                    this.migratePreferenceKey(key, localStorage[key]);
                } else if(key.startsWith('eon.extension')) {
                    this.migrateStorageKey(key, localStorage[key]);
                } else {
                    return;
                }
            } catch(err) {
                Log.warn('Unable to migrate "%s" key: %s', key, err.message, err);
                return;
            }

            // Remove key
            delete localStorage[key];
        });
    }

    migratePreferenceKey(key, value) {
        let targetKey = this.transformKey(key, 1);

        // Ensure target key hasn't already been defined
        if(!IsNil(localStorage[targetKey])) {
            Log.debug('Preference "%s" has already been defined', targetKey);
            return;
        }

        // Store value
        localStorage[targetKey] = value;
    }

    migrateStorageKey(key, value) {
        let targetKey = this.transformKey(key, 0);

        // Ensure target key hasn't already been defined
        if(!IsNil(localStorage[targetKey])) {
            Log.debug('Value "%s" has already been defined', targetKey);
            return;
        }

        // Store value
        localStorage[targetKey] = value;
    }

    transformKey(key, position) {
        let parts = key.split(':');

        // Ensure context matches old format
        if(!parts[position].startsWith('eon.extension')) {
            throw new Error('Invalid context: ' + parts[position]);
        }

        // Transform context
        parts[position] = this.transformContextName(parts[position]);

        // Combine parts
        return parts.join(':');
    }

    transformContextName(name) {
        let parts = name.split('.');

        // Ensure context matches old format
        if(parts[0] !== 'eon' || parts[1] !== 'extension') {
            throw new Error('Invalid context: ' + name);
        }

        // Update name
        parts[0] = 'neon';

        // Combine parts
        return parts.join('-');
    }
}
