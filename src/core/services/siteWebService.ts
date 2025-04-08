export async function getRootWebId(absoluteSiteUrl: string) {
    const d = await fetch(`${absoluteSiteUrl}/_api/web?$select=Id`, {headers: { accept: "application/json;odata=nometadata" }});
    const data = await d.json();
    console.log("getRootWebId", data);
}