import { StyleSheet } from "react-native";
export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
      },
      headerContainer: {
        paddingTop: 20,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
      },
      backButton: {
        padding: 5,
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
        paddingHorizontal: 0,
        paddingBottom: 80,
        backgroundColor: 'black',
        minHeight: '100%',
      },
      emptyListContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
      },
      unreadConversation: {
        backgroundColor: 'rgba(255, 200, 60, 0.05)',
      },
      avatarContainer: {
        position: 'relative',
        marginRight: 12,
      },
      avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
      },
      unreadBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#FFC83C',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
      },
      unreadBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '600',
      },
      initialsContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFC83C',
        justifyContent: 'center',
        alignItems: 'center',
      },
      initialsText: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
      },
      contentContainer: {
        flex: 1,
        marginRight: 10,
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
      },
      nameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
      },
      boldText: {
        fontWeight: '700',
      },
      timeText: {
        fontSize: 14,
        color: '#888',
      },
      messageText: {
        fontSize: 16,
        color: 'white',
      },
      chevron: {
        marginLeft: 'auto',
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
      },
      emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#222',
        marginTop: 12,
        textAlign: 'center',
      },
      emptySubtext: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
      },
})