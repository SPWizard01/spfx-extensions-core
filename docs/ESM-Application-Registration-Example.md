# ESM Application Registration Example

This example demonstrates how to create an ESM-based application using the SPFx Extensions framework.

## 1. Create the App Entry Point File

Create a file named `my-app.ts` in your application folder:

```typescript
import { SPFxExtensionAppRegistration } from "../models/appModel";

// Define your application
const myApplication: SPFxExtensionAppRegistration = {
  id: "my-unique-app-id",
  name: "My ESM Application",
  description: "An example ESM application with lifecycle events",
  isWebPartApp: true,
  autoExecute: false,
  keepOnContextChange: false,
  maxInstances: 1,
  
  async onInstanceRequested(newInstance) {
    console.log(`Instance requested for ${this.name} with key: ${newInstance.key}`);
    
    // Listen for context changes
    const contextChangeListener = newInstance.addEventListener("contextChange", (eventData) => {
      console.log("Context changed:", eventData.initializationData.web.title);
      // Update UI based on new context
    });
    
    // Listen for configuration changes
    const configChangeListener = newInstance.addEventListener("onConfigurationChange", (config) => {
      console.log("Configuration changed:", config);
      // Update app based on new configuration
    });
    
    // Listen for render events
    newInstance.addEventListener("onRender", () => {
      console.log("Render requested");
      // Re-render the application
    });
    
    // Initialize UI if we have a DOM element
    if (newInstance.domElement) {
      newInstance.domElement.innerHTML = `
        <div class="my-app-container">
          <h2>My ESM Application</h2>
          <p>Application is now loaded!</p>
        </div>
      `;
    }
    
    // Return a cleanup function
    return () => {
      console.log(`Cleaning up instance with key: ${newInstance.key}`);
      
      // Explicit cleanup of listeners (optional as they're auto-cleaned on unmount)
      contextChangeListener();
      configChangeListener();
      
      // Clean up DOM if needed
      if (newInstance.domElement) {
        newInstance.domElement.innerHTML = "";
      }
    };
  }
};

// Export our application (must be default export and an array)
export default [myApplication];
```

## 2. Update Your Manifest

Ensure your app's manifest has the following settings:

```json
{
  "appRelativeEntryPointUrls": [
    "./my-app.js"
  ],
  "appDefinitionMap": [
    {
      "appId": "my-unique-app-id",
      "config": {
        "enabledEverywhere": true,
        "includedIds": [],
        "includedHubIds": [],
        "excludedIds": [],
        "excludedHubIds": []
      }
    }
  ],
  "isESM": true
}
```

## 3. Register Global Event Listeners (Optional)

If you want to listen for global app events, add this code in a global script:

```typescript
// Listen for new app registrations
const appListener = window.__SPFxExtensions.AddAppEventListener("appAdded", (appDef) => {
  console.log(`New app registered: ${appDef.id} (${appDef.name})`);
});

// Listen for new instances
const instanceListener = window.__SPFxExtensions.AddAppEventListener("instanceAdded", (data) => {
  console.log(`New instance created for: ${data.app.name}`);
});

// Remove listeners when no longer needed
// window.__SPFxExtensions.RemoveAppEventListener(appListener);
// window.__SPFxExtensions.RemoveAppEventListener(instanceListener);
```

## 4. Non-ESM Example (Legacy Approach)

For comparison, this is how you would create a non-ESM application:

```javascript
// legacy-app.js
(function() {
  // Define the app
  const legacyApp = {
    id: "legacy-app-id",
    name: "Legacy Application",
    description: "A non-ESM application example",
    isWebPartApp: false,
    
    async onInstanceRequested(newInstance) {
      if (newInstance.domElement) {
        newInstance.domElement.innerHTML = "<div>Legacy App Loaded</div>";
      }
      
      // Listen for context changes
      newInstance.addEventListener("contextChange", (eventData) => {
        console.log("Context changed in legacy app");
      });
      
      return () => {
        console.log("Legacy app cleanup");
        if (newInstance.domElement) {
          newInstance.domElement.innerHTML = "";
        }
      };
    }
  };
  
  // Register the app with the core
  window.__SPFxExtensions.RegisterApp(legacyApp).then(appDefinition => {
    console.log("Legacy app registered successfully");
    
    // Optionally instantiate it immediately
    window.__SPFxExtensions.InstantiateApp("legacy-app-id", {
      // Runtime configuration if needed
    });
  });
})();
```

Remember that for non-ESM apps, you need to set `"isESM": false` in your manifest and include the app ID in your `appDefinitionMap`.
