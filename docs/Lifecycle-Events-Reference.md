# SPFx Extensions Lifecycle Events Reference

This document provides a comprehensive reference for all lifecycle events available in the SPFx Extensions framework.

## Application Lifecycle Overview

The application lifecycle in the SPFx Extensions framework consists of the following major phases:

1. **Registration**: Application is registered with the Core system
2. **Instantiation**: An instance of the application is created
3. **Instance Requested**: The application's `onInstanceRequested` method is called
4. **Active Phase**: The application instance is running and receiving events
5. **Unmount**: The application instance is unmounted, and cleanup function is called

## Global Events

These events are emitted at the window level and can be subscribed to using `window.__SPFxExtensions.AddAppEventListener`.

| Event | Description | Payload | Trigger Point |
|-------|-------------|---------|---------------|
| `appAdded` | An application has been registered | `SPFxExtensionAppDefinition` | After `RegisterApp` completes successfully |
| `instanceAdded` | An instance of an application has been created | `{ app: SPFxExtensionAppDefinition, instance: SPFxExtensionAppInstance }` | After `InstantiateApp` creates an instance |

## Instance-Level Events

These events are specific to an application instance and can be subscribed to using `instance.addEventListener`.

### Core Lifecycle Events

| Event | Description | Payload | Trigger Point |
|-------|-------------|---------|---------------|
| `onRender` | The application should render itself | `undefined` | When the host container requests a render |
| `onConfigurationClose` | The configuration panel is being closed | `undefined` | When the user closes the configuration panel or during unmount |
| `contextChange` | The SharePoint context has changed (e.g., navigating to another site) | `ContextChangeEventDetails` | When navigating between different sites/webs |
| `contextRefresh` | The SharePoint context refreshed but remains on the same web | `ContextChangeEventDetails` | When context refreshes without changing web ID |

### Configuration Events

| Event | Description | Payload | Trigger Point |
|-------|-------------|---------|---------------|
| `onConfigurationRender` | The configuration UI should be rendered | `SPFxExtensionAppPropertyPaneConfigRender` | When the property pane opens for the application |
| `onConfigurationChange` | The application configuration has changed | `SPFxExtensionAppConfig` | When a user changes configuration values |

### Display Events

| Event | Description | Payload | Trigger Point |
|-------|-------------|---------|---------------|
| `onDisplayModeChange` | The display mode has changed (edit vs read) | `CompatibleDisplayMode` | When switching between edit and display modes |
| `onPlaceholdersChanged` | Placeholders available to the application have changed | `any` | When SharePoint placeholders change |
| `onAppCustomizerDisposed` | An app customizer is being disposed | `undefined` | When an application customizer is removed |

## Event Flow During Context Change

During a context change (navigating between SharePoint sites), the following event sequence occurs:

1. `contextChange` event is dispatched to all instances
2. For each app with `keepOnContextChange: false`:
   - Instances belonging to previous context are unmounted
   - `onConfigurationClose` event is dispatched to those instances
   - Cleanup functions from `onInstanceRequested` are called

## Application Registration Lifecycle

When registering an application:

1. Core ensures the app doesn't already exist with `ensureApp()`
2. App metadata is set from the registration object
3. `registrationCompleted` flag is set to true
4. `appAdded` event is dispatched
5. For existing instances, `loadAppInstance()` is called, triggering `onInstanceRequested`

## Application Instance Lifecycle

When an instance is created:

1. `createAppInstance()` generates a new instance with unique key and context ID
2. Event handlers are registered via `registerEventHandlers()`
3. Instance is added to the app's instances array
4. `instanceAdded` event is dispatched
5. If app registration is complete, `loadAppInstance()` calls `onInstanceRequested`
6. When `onInstanceRequested` resolves, the cleanup function is stored
7. `instanceExecuted` flag is set to true
8. `instanceLoadPromiseResolver()` is called to resolve the load promise

## Unmount Lifecycle

When an instance is unmounted:

1. Instance is removed from the app's instances array
2. `onConfigurationClose` event is dispatched
3. All event listeners are removed from the instance
4. The cleanup function returned by `onInstanceRequested` is called

## AutoExecute Lifecycle

For applications with `autoExecute: true`:

1. After successful registration, the core automatically checks `maxInstances`
2. If the current instance count is less than `maxInstances`, `InstantiateApp` is called
3. The normal instantiation lifecycle occurs

## Context-Change Related Properties

| Property | Default | Description |
|----------|---------|-------------|
| `keepOnContextChange` | `false` | When `true`, instances remain active during context changes |
| `unmountOnRender` | `true` | When `true`, the instance is unmounted and recreated on render |

## ESM vs Non-ESM Lifecycle Differences

### ESM Applications
- Must export an array of `SPFxExtensionAppRegistration` objects as default
- Registration happens automatically when the module is loaded
- Auto-execution can be enabled with `autoExecute: true`

### Non-ESM Applications
- Must call `RegisterApp` and `InstantiateApp` methods directly
- Registration happens when the script explicitly calls `RegisterApp`
- Must handle their own instantiation logic
