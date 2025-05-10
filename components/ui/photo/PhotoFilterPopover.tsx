import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { photoFilterStyles } from '@/app/(app)/home/styles/photoFilterStyles';

export type FilterOption = 'all' | 'friends' | 'mine';

interface FilterItem {
  id: FilterOption;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  avatarStyle?: object;
}

interface PhotoFilterPopoverProps {
  activeFilter: FilterOption;
  onSelectFilter: (filter: FilterOption) => void;
  friendCount?: number;
  filterItems?: FilterItem[];
}

// Default filter items - can be overridden via props
const defaultFilterItems: FilterItem[] = [
  { 
    id: 'all', 
    label: 'Everyone', 
    icon: 'people', 
    avatarStyle: photoFilterStyles.everyoneAvatar 
  },
  { 
    id: 'friends', 
    label: 'Friends', 
    icon: 'people-outline', 
    avatarStyle: photoFilterStyles.groupAvatar 
  },
  { 
    id: 'mine', 
    label: 'Just me', 
    icon: 'person', 
    avatarStyle: photoFilterStyles.currentUserAvatar
  },
];

/**
 * PhotoFilterPopover - A reusable component for filtering photos
 * 
 * Uses React Native's Modal for dropdown menu
 * Following SOLID principles with separation of concerns
 */
const PhotoFilterPopover: React.FC<PhotoFilterPopoverProps> = ({
  activeFilter,
  onSelectFilter,
  friendCount = 0,
  filterItems = defaultFilterItems,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Get the active filter's label
  const getActiveFilterLabel = () => {
    const active = filterItems.find(item => item.id === activeFilter);
    return active ? active.label : 'Everyone';
  };

  // Toggle modal visibility
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  // Handle filter selection
  const handleSelectFilter = (filter: FilterOption) => {
    onSelectFilter(filter);
    setIsModalVisible(false);
  };

  return (
    <View>
      {/* Trigger Button */}
      <TouchableOpacity 
        style={photoFilterStyles.popoverTrigger}
        onPress={toggleModal}
      >
        <Ionicons name="people" size={18} color="white" />
        <Text style={photoFilterStyles.label}>
          {friendCount > 0 ? `${friendCount} ${getActiveFilterLabel()}` : getActiveFilterLabel()}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color="white" 
          style={photoFilterStyles.chevron} 
        />
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableOpacity
          style={photoFilterStyles.modalContainer}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}
        >
          {/* Filter Content */}
          <View 
            style={[
              photoFilterStyles.popoverContent,
              {
                marginTop: 100, // Position from top
                alignSelf: 'center', // Center horizontally
              }
            ]}
          >
            {filterItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  photoFilterStyles.filterItem,
                  index === filterItems.length - 1 && photoFilterStyles.filterItemLast
                ]}
                onPress={() => handleSelectFilter(item.id)}
              >
                <View style={[photoFilterStyles.avatar, item.avatarStyle]}>
                  <Ionicons name={item.icon} size={18} color="white" />
                </View>
                <Text style={photoFilterStyles.filterItemText}>{item.label}</Text>
                
                {activeFilter === item.id && (
                  <View style={{ marginLeft: 'auto' }}>
                    <Ionicons name="checkmark" size={20} color="#FFB800" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default PhotoFilterPopover; 