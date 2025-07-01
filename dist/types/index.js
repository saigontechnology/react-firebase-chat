// Message types matching RN implementation
export var MessageTypes;
(function (MessageTypes) {
    MessageTypes["text"] = "text";
    MessageTypes["image"] = "image";
    MessageTypes["video"] = "video";
    MessageTypes["file"] = "file";
    MessageTypes["system"] = "system";
})(MessageTypes || (MessageTypes = {}));
// Firestore collections enum
export var FireStoreCollection;
(function (FireStoreCollection) {
    FireStoreCollection["users"] = "users";
    FireStoreCollection["conversations"] = "conversations";
    FireStoreCollection["messages"] = "messages";
})(FireStoreCollection || (FireStoreCollection = {}));
//# sourceMappingURL=index.js.map