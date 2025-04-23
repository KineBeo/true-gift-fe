import { StyleSheet } from "react-native";
export const chatListStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
      },
      headerContainer: {
        paddingTop: 15,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
      },
      backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
      },
      headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
      },
      headerRight: {
        width: 40,
      },
      listContent: {
        paddingVertical: 8,
      },
      emptyListContent: {
        flex: 1,
      },
      conversationItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
      },
      avatarContainer: {
        marginRight: 12,
      },
      avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#333',
      },
      initialsContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
      },
      initialsText: {
        color: '#999',
        fontSize: 22,
        fontWeight: 'bold',
      },
      contentContainer: {
        flex: 1,
        paddingRight: 10,
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      },
      nameText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: 'white',
      },
      timeText: {
        fontSize: 14,
        color: '#888',
      },
      messageText: {
        fontSize: 15,
        color: '#999',
      },
      chevron: {
        marginLeft: 5,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
      },
      emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
      },
      emptySubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
      },
})