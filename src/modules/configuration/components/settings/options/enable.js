import {DeclarativeContent, Permissions, Preferences} from 'eon.extension.browser';

import {OptionComponent} from 'eon.extension.framework/services/configuration/components';

import merge from 'lodash-es/merge';
import React from 'react';


export default class EnableComponent extends OptionComponent {
    constructor() {
        super();

        this.state = {
            id: null,
            enabled: false
        };
    }

    componentWillMount() {
        console.timeStamp('EnableComponent.componentWillMount()');
        this.refresh(this.props.id, this.props.options);
    }

    componentWillReceiveProps(nextProps) {
        console.timeStamp('EnableComponent.componentWillReceiveProps()');
        this.refresh(nextProps.id, nextProps.options);
    }

    shouldComponentUpdate(nextProps, nextState) {
        console.timeStamp('EnableComponent.shouldComponentUpdate()');

        if(nextProps.id !== this.state.id) {
            return true;
        }

        if(nextState.enabled !== this.state.enabled) {
            return true;
        }

        return false;
    }

    refresh(id, options) {
        // Retrieve option state
        return Preferences.getBoolean(id).then((enabled) => {
            if(!enabled) {
                this.setState({id: id, enabled: false});
                return Promise.resolve();
            }

            // Ensure permissions have been granted (if defined)
            if(options.permissions) {
                let {permissions, origins} = options.permissions;

                return Permissions.contains(permissions, origins).then((granted) => {
                    this.setState({id: id, enabled: granted});
                });
            }

            this.setState({id: id, enabled: true});
            return Promise.resolve();
        });
    }

    onChanged(event) {
        let enabled = event.target.checked;

        // Process state change event
        return this.updatePermissions(enabled)
            .then(() => this.updateContentScripts(enabled))
            .then(() => this.updatePreference(enabled))
            .catch((error) => {
                console.warn('Unable to update permissions: %o', error);
            });
    }

    updateContentScripts(enabled) {
        if(!this.props.options.contentScripts) {
            console.debug('No content scripts required');
            return Promise.resolve();
        }

        // Build list of declarative rules
        let rules = [];
        let ruleIds = [];

        this.props.options.contentScripts.forEach((script) => {
            script = merge({
                id: null,
                conditions: [],
                css: [],
                js: []
            }, script);

            if(script.id === null) {
                console.warn('Ignoring invalid content script: %O (invalid/missing "id" property)', script);
                return;
            }

            // Add rule identifier
            if(ruleIds.indexOf(script.id) !== -1) {
                console.warn('Content script with identifier %o has already been defined', script.id);
                return;
            }

            ruleIds.push(script.id);

            // Build rule
            if(!Array.isArray(script.conditions) || script.conditions.length < 1) {
                console.warn('Ignoring invalid content script: %O (invalid/missing "conditions" property)', script);
                return;
            }

            rules.push({
                id: script.id,
                conditions: script.conditions,
                actions: [
                    {
                        css: script.css,
                        js: script.js
                    }
                ]
            });
        });

        if(enabled) {
            console.debug('Updating declarative rules...');
            return DeclarativeContent.removeRules(ruleIds)
                .then(() => DeclarativeContent.addRules(rules));
        }

        console.debug('Removing declarative rules...');
        return DeclarativeContent.removeRules(ruleIds);
    }

    updatePermissions(enabled) {
        if(!this.props.options.permissions) {
            console.debug('No permissions required');
            return Promise.resolve();
        }

        let {permissions, origins} = this.props.options.permissions;

        if(enabled) {
            console.debug('Requesting permissions...');
            return Permissions.request(permissions, origins);
        }

        console.debug('Removing permissions...');
        return Permissions.remove(permissions, origins);
    }

    updatePreference(enabled) {
        // Update preference
        return Preferences.putBoolean(this.props.id, enabled)
            .then(() => {
                // Update component
                this.setState({enabled: enabled});
            });
    }

    render() {
        console.timeStamp('EnableComponent.render()');

        return (
            <div data-component="eon.extension.core:settings.options.enable" className="switch tiny">
                <input
                    className="switch-input"
                    id={this.props.id}
                    type="checkbox"
                    checked={this.state.enabled}
                    onChange={this.onChanged.bind(this)}
                />

                <label className="switch-paddle" htmlFor={this.props.id}>
                    {this.props.options.summary && <span className="show-for-sr">
                        {this.props.options.summary}
                    </span>}
                </label>
            </div>
        );
    }
}

EnableComponent.defaultProps = {
    id: null,
    label: null,

    options: {
        summary: null,

        contentScripts: [],
        permissions: {}
    }
};
