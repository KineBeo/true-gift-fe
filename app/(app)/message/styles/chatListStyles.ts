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
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderBottomColor: 'gray',
        borderBottomWidth: 0.5,
      },
      backButton: {
        padding: 5,
      },
      headerTitle: {
        fontSize: 25,
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
      unreadText: {
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
      messageInfoContainer: {
        flex: 1,
        marginRight: 10,
      },
      nameTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
      },
      previewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      nameText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        maxWidth: '80%',
      },
      boldText: {
        fontWeight: '700',
      },
      timeText: {
        fontSize: 14,
        color: '#888',
      },
      previewText: {
        fontSize: 16,
        color: '#888',
        maxWidth: '85%',
      },
      unreadPreviewText: {
        color: 'white',
        fontWeight: '600',
      },
      typingText: {
        fontSize: 16,
        color: '#FFC83C',
        fontStyle: 'italic',
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
        color: 'white',
        marginTop: 12,
        textAlign: 'center',
      },
      emptySubText: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
      },
      retryButton: {
        marginTop: 16,
        backgroundColor: '#FFC83C',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
      },
      retryText: {
        color: '#000',
        fontWeight: '600',
      },
      // Styles for connection status
      connectionStatusContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#2C2C2E',
        padding: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      },
      connectionStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
      },
      connectingDot: {
        backgroundColor: '#FFC83C',
      },
      disconnectedDot: {
        backgroundColor: '#FF453A',
      },
      connectionStatusText: {
        fontSize: 12,
        color: 'white',
        fontWeight: '500',
      }
})