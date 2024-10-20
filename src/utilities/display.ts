export function getClassicDisplayMode() {
    const inDesignModeElem =
        window.MSOLayout_InDesignMode &&
        window.MSOLayout_InDesignMode.value === "1";
    const inDesignModeWiki =
        window.MSOLayout_IsWikiEditMode && window.MSOLayout_IsWikiEditMode();
    if (inDesignModeElem || inDesignModeWiki || window.MSOLayout_inDesignMode) {
        return "Edit";
    }
    return "Read";
}

export function getModernDisplayMode() {
    return window.location.search.indexOf("Mode=Edit") !== -1 ? "Edit" : "Read";
}
