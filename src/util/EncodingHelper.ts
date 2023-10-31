export function encodeBase64(obj: object) {
    const json = JSON.stringify(obj);
    return Buffer.from(json).toString("base64");
}

export function decodeBase64(str: string): object {
    const json = Buffer.from(str, "base64").toString();
    return JSON.parse(json);
}