import type { SPFxExtensionAppRegistration } from "../models/appModel";
import { logGenericCoreInfo } from "./services/loggingService";

export const cardApp: SPFxExtensionAppRegistration = {
  id: "asd123",
  description: "Card Tryouts",
  hideAppSelectorWhenAppLoaded: true,
  hideConfiguratorButton: true,
  name: "My New Card App",
  instanceType: "adaptiveCard",
  // cardSize() {
  //   return "Medium";
  // },
  // iconProperty() {
  //   return "None";
  // },
  // renderCard() {
  //   return "";
  // },
  // loadPropertyPaneResources() {
  //   return Promise.resolve();
  // },
  // registerViews() {
  //   console.warn("Register views called");
  //   return Promise.resolve();
  // },
  // getCardViewParameters(viewId) {
  //   return {};
  // },
  async onInstanceRequested(newInstance) {
    logGenericCoreInfo("Adaptive card instance requested", newInstance);
    newInstance.registerViews = async (registrators) => {
      registrators.RegisterViewCard("MyView1", "BasicCardView");
      registrators.RegisterQuickView("MyQuickView1");
      registrators.RegisterWebQuickView("MyWebQuickView1");
    };
    newInstance.renderCard = () => {
      return "MyView1";
    };
    newInstance.getCardViewParameters = (viewId) => {
      //bogus just to check
      return {
        cardBar: {
          componentName: "cardBar",
          title: "Data",
        },
        header: {
          componentName: "text",
          text: "Data from Adaptive Card code",
        },
        footer: {
          componentName: "cardButton",
          title: "Open Quick View",
          action: {
            type: "QuickView",
            parameters: {
              view: "MyWebQuickView1",
            },
          },
        },
      };
    };

    newInstance.getQuickViewData = (viewId) => {
      return { viewId: viewId };
    };

    newInstance.getQuickViewTemplate = (viewId) => {
      const d = {
        type: "AdaptiveCard",
        $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        body: [
          {
            type: "TextBlock",
            text: viewId,
            wrap: true,
          },
        ],
      };
      return d;
    };

    newInstance.renderWebQuickView = (viewId, element) => {
      element.innerHTML = `<div style="padding:20px;"><h1>${viewId}</h1><p>This is a web quick view</p></div>`;
    };

    return () => {};
  },
};
