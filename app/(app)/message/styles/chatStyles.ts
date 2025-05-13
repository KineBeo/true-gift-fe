import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MESSAGE_IMAGE_SIZE = SCREEN_WIDTH * 0.65;

export const chatStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    padding: 5,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  initialsContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC83C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initialsText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  typingText: {
    fontSize: 12,
    color: '#FFC83C',
    marginTop: 2,
  },
  headerIconsContainer: {
    flexDirection: 'row',
  },
  headerIcon: {
    padding: 5,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  flatListContent: {
    padding: 16,
    paddingBottom: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold', 
    color: 'white',
    marginTop: 12,
    textAlign: 'center',
  }, 
  emptySubtext: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    padding: 10,
    borderRadius: 20,
    marginBottom: 8,
    maxWidth: '75%',
  },
  userMessageContainer: {
    backgroundColor: '#FFC83C',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessageContainer: {
    backgroundColor: '#2C2C2E',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    flexDirection: 'column',
    width: '100%',
  },
  messageImage: {
    width: MESSAGE_IMAGE_SIZE,
    height: MESSAGE_IMAGE_SIZE,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    marginBottom: 4,
  },
  userMessageImage: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  centeredImageContainer: {
    alignSelf: 'center',
    marginVertical: 10,
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  centeredImage: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    borderRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#000',
  },
  otherMessageText: {
    color: '#FFFFFF',
  },
  timestampText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  readText: {
    fontWeight: '500',
  },
  timeHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timeHeaderText: {
    fontSize: 12,
    color: '#888',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inputContainer: {
    width: '100%',
    padding: 12,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 0.5,
    borderTopColor: '#2C2C2E',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    paddingVertical: 12,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  photoUserBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoUserText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  reactionContainer: {
    position: 'absolute',
    bottom: -10,
    right: 10,
    backgroundColor: '#3A3A3C',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  reactionText: {
    fontSize: 12,
    color: 'white'
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
});