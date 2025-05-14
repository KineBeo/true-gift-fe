import { Dimensions, StyleSheet, Platform, StatusBar } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SPACING = 2;
const NUM_COLUMNS = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - (GRID_SPACING * (NUM_COLUMNS + 1))) / NUM_COLUMNS;

export const imageHistoryStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  gridContainer: {
    backgroundColor: 'black',
    width: SCREEN_WIDTH,
    paddingTop: 4,
    paddingLeft: GRID_SPACING,
    paddingBottom: 400,
  },
  photoGrid: {
    width: SCREEN_WIDTH,
    flexDirection: 'row',
    gap: 2
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    marginBottom: GRID_SPACING,
    borderRadius: 20,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'white',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  ipfsBadge: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(0, 102, 204, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ipfsBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  usernameBadge: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  usernameText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fallbackContainer: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#999',
    fontSize: 10,
    marginTop: 4,
  },
  topBarContainer: {
    position: 'absolute',
    top: 30,
    backgroundColor: 'red',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  bottomControlsContainer: {
    position: 'absolute',
    bottom: 140,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  activeTab: {
    backgroundColor: '#FFB800',
  },
  tabButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myPhotoIndicator: {
    position: 'absolute',
    left: 5,
    top: 5,
    backgroundColor: '#FFB800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  myPhotoText: {
    color: 'black',
    fontSize: 8,
    fontWeight: 'bold',
  },
  segmentControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(60, 60, 60, 0.5)',
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'center',
    marginTop: 50,
  },
  segmentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  activeSegment: {
    backgroundColor: '#FFB800',
  },
  segmentText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  activeSegmentText: {
    color: 'black',
  }
});
