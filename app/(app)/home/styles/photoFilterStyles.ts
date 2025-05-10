import { StyleSheet } from "react-native";

export const photoFilterStyles = StyleSheet.create({
  popoverTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  popoverContent: {
    backgroundColor: 'rgba(45, 45, 45, 0.95)',
    borderRadius: 16,
    width: 250,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
    padding: 0,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popoverArrow: {
    backgroundColor: 'rgba(45, 45, 45, 0.95)',
    borderWidth: 1,
    borderColor: '#444',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100, 100, 100, 0.2)',
  },
  filterItemLast: {
    borderBottomWidth: 0,
  },
  filterItemText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#555',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatar: {
    backgroundColor: '#444',
  },
  everyoneAvatar: {
    backgroundColor: '#555',
  },
  currentUserAvatar: {
    backgroundColor: '#FFB800',
  },
  chevron: {
    marginLeft: 6,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  }
}); 