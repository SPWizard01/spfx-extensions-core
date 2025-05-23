# SPFx Extensions: Application Registration and Lifecycle Events

This documentation provides a comprehensive guide to registering applications within the SPFx Extensions framework and understanding the lifecycle events that occur during an application's existence.

## Table of Contents

1. [Introduction](#introduction)
2. [Application Registration Overview](#application-registration-overview)
3. [Creating and Registering an Application](#creating-and-registering-an-application)
   - [ESM Module Applications](#esm-module-applications)
   - [Non-ESM Applications](#non-esm-applications)
4. [Application Lifecycle Events](#application-lifecycle-events)
   - [Global Events](#global-events)
   - [Instance-Level Events](#instance-level-events)
5. [Application Instance Lifecycle](#application-instance-lifecycle)
6. [Context Change Handling](#context-change-handling)
7. [Best Practices](#best-practices)

## Introduction

The SPFx Extensions framework provides a robust system for registering, instantiating, and managing applications within the SharePoint environment. Applications can be registered both as ESM (ECMAScript Module) or non-ESM modules, with different registration patterns for each approach.

Why? Because SPFx locks you into node, with this you can use any framework and any bundler.
Furthermore this give you ability to use ES Modules.

How it works: There is a separate package (`sppkg`) which you will need to deploy tenant wide, this will install 2 things, a webpart and app customizer, that package will also include a build of this package. Depending on page either customized or webpart will execute this package.
Once executed it will offload all the handling to this package, only forwarding events.

## Application Registration Overview

Applications in the framework are represented by the `SPFxExtensionAppDefinition` interface. 
For Non-ESM modules, each application needs to be registered with the core system using the `window.__SPFxExtensions.RegisterApp` method, which takes an `SPFxExtensionAppRegistration` object.

Applications can be:
- **ESM-based**: Using modern ES modules with explicit default export, which is then handled by core system.
- **Non-ESM**: Using older module patterns that register themselves by directly calling core methods

## Creating and Registering an Application

### ESM Module Applications

ESM applications are the preferred approach and provide a cleaner development experience. To create an ESM application:

1. First, create your application manifest and set `isESM: true`.

2. Create your entry point JS file (e.g., app.js) that exports an array of application definitions:

```typescript
// app.js
const myApp = {
  id: "unique-app-id",
  name: "My Application",
  description: "Description of my application",
  isWebPartApp: true, // Set to true if should appear in webpart picker
  keepOnContextChange: false, // Whether to keep instances when context changes
  autoExecute: true, // Auto-execute when registered (only for non-WebPart apps)
  maxInstances: 1, // Limit number of instances
  
  // The crucial lifecycle method called when an instance is requested
  async onInstanceRequested(newInstance: SPFxExtensionAppInstance) {
    // Initialize your app using the provided instance
    console.log(`App instance requested with key: ${newInstance.key}`);
    
    // Set up DOM elements if needed
    if (newInstance.domElement) {
      newInstance.domElement.innerHTML = "<div>Hello World!</div>";
    }
    
    // Return a cleanup function that will be called on unmount
    return () => {
      console.log("App instance cleanup");
      // Perform cleanup actions
    };
  }
};

// Default export is required for ESM applications
export default [myApp];
```

3. Add the entry point to your manifest's `appRelativeEntryPointUrls` array and include your application ID in the `appDefinitionMap` with configuration.

### Non-ESM Applications

For non-ESM applications, set `isESM: false` in your manifest and directly call the global registration methods:

```javascript
// legacy-app.js
(function() {
  // Register the app
  window.__SPFxExtensions.RegisterApp({
    id: "legacy-app-id",
    name: "Legacy Application",
    description: "A non-ESM application",
    isWebPartApp: false,
    
    async onInstanceRequested(newInstance) {
      // Implementation
      return () => {
        // Cleanup
      };
    }
  }).then(appDefinition => {
    console.log("App registered:", appDefinition);
  });
  
  // Optionally, instantiate the app immediately
  window.__SPFxExtensions.InstantiateApp("legacy-app-id", {
    // Runtime configuration
  });
})();
```

## Application Lifecycle Events

The framework provides several types of events that occur during an application's lifecycle.

### Global Events

Global events apply to all applications and can be subscribed to using `window.__SPFxExtensions.AddAppEventListener`:

| Event | Description | Payload |
|-------|-------------|---------|
| `appAdded` | Triggered when an application is registered | `SPFxExtensionAppDefinition` |
| `instanceAdded` | Triggered when an instance of an application is created | `{ app: SPFxExtensionAppDefinition, instance: SPFxExtensionAppInstance }` |

Example usage:

```javascript
const listener = window.__SPFxExtensions.AddAppEventListener("appAdded", (appDef) => {
  console.log(`New app registered: ${appDef.id} (${appDef.name})`);
});

// Later, remove the listener if needed
window.__SPFxExtensions.RemoveAppEventListener(listener);
```

### Instance-Level Events

Instance events are specific to a particular app instance and can be subscribed to using the instance's `addEventListener` method:

| Event | Description | Payload |
|-------|-------------|---------|
| `onConfigurationRender` | Triggered when the configuration UI should render | `SPFxExtensionAppPropertyPaneConfigRender` |
| `onConfigurationClose` | Triggered when configuration UI is closed | `undefined` |
| `onConfigurationChange` | Triggered when configuration changes | `SPFxExtensionAppConfig` |
| `onDisplayModeChange` | Triggered when display mode changes | `CompatibleDisplayMode` |
| `contextChange` | Triggered when SharePoint context changes | `ContextChangeEventDetails` |
| `contextRefresh` | Triggered when the context refreshes (but ID stays the same) | `ContextChangeEventDetails` |
| `onPlaceholdersChanged` | Triggered when placeholders change | `any` |
| `onAppCustomizerDisposed` | Triggered when an app customizer is disposed | `undefined` |
| `onRender` | Triggered when the app should render | `undefined` |

Example usage within an application:

```javascript
async onInstanceRequested(newInstance) {
  // Listen for context change events
  const contextChangeCleanup = newInstance.addEventListener("contextChange", (eventData) => {
    console.log("Context changed:", eventData);
    // Handle context change
  });

  // Listen for render events
  const renderCleanup = newInstance.addEventListener("onRender", () => {
    console.log("Render requested");
    // Re-render the application
  });

  // Return a cleanup function that will remove event listeners and perform cleanup
  return () => {
    // Event listeners will be automatically cleaned up when the app is unmounted,
    // but you can manually clean them up if needed before that
    contextChangeCleanup();
    renderCleanup();
    console.log("App instance cleanup");
  };
}
```

## Application Instance Lifecycle

An application instance goes through several states during its lifetime:

1. **Creation**: Created via `InstantiateApp` with a unique key and assigned context ID
2. **Initialization**: `onInstanceRequested` is called, and the application is given a chance to set up
3. **Active**: The instance is fully loaded and executing
4. **Unmount**: The instance is unmounted and the cleanup function from `onInstanceRequested` is called

## Context Change Handling

The framework automatically handles context changes in SharePoint (like navigating between sites). You can control how your app behaves during context changes:

- Set `keepOnContextChange: true` to keep instances alive across context changes
- Listen to `contextChange` events to respond to context changes
- Handle lifecycle events appropriately to clean up resources when a context change occurs

```javascript
const myApp = {
  id: "context-aware-app",
  name: "Context-Aware App",
  // Keep app running during context changes
  keepOnContextChange: true,
  
  async onInstanceRequested(newInstance) {
    // Set up resources
    
    // Add event listener for context changes
    const eventCleanup = newInstance.addEventListener("contextChange", (details) => {
      console.log("Context changed to:", details.initializationData.web.title);
      // Update UI for new context
    });
    
    // Return cleanup function
    return () => {
      // Clean up resources
      eventCleanup();
    };
  }
};
```

## Best Practices

1. **Always return a cleanup function** from `onInstanceRequested` to prevent memory leaks.

2. **Use ESM modules** when possible for cleaner architecture and better tooling support.

3. **Limit instances appropriately** using the `maxInstances` property to prevent resource overuse.

4. **Handle context changes** properly by either setting `keepOnContextChange` or listening to context events.

5. **Provide clear naming and descriptions** for your applications to make them discoverable.

6. **Implement proper error handling** in all lifecycle methods to ensure stability.

7. **Minimize DOM manipulation** in the `onInstanceRequested` method, focusing instead on initialization.

8. **Use event listeners** to respond to changes rather than polling or other techniques.

9. **Clean up all resources** when your application is unmounted to prevent memory leaks.

10. **Test across different contexts** to ensure your application behaves correctly during navigation.
