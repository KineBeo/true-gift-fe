import { StyleSheet } from "react-native";
export const chatStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
      },
      avatar: {
        width: 36,
        height: 36,
        borderRadius: 20,
      },
      sentMessage: {
        marginLeft: 40,
      },
      receivedMessage: {
        marginRight: 40,
      },
      inputContainer: {
        backgroundColor: "#000",
      },
      input: {
        fontSize: 16,
        maxHeight: 100,
      },
      messageImage: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 30,
      },
      photoUserBadge: {
        position: "absolute",
        top: 8,
        left: 12,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        borderRadius: 30,
        paddingHorizontal: 10,
        paddingVertical: 4,
        flexDirection: "row",
        alignItems: "center",
      },
      photoUserText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
        marginLeft: 4,
      },
      reactionContainer: {
        position: "absolute",
        bottom: 0,
        borderRadius: 20,
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
      },
      reactionText: {
        fontSize: 15,
      },
})