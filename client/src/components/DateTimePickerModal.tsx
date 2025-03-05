import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type DateTimePickerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (selectedValue: Date) => void;
  currentValue: Date;
  mode: 'date' | 'time';
  title: string;
};

const DateTimePickerModal = ({
  isVisible,
  onClose,
  onConfirm,
  currentValue,
  mode,
  title
}: DateTimePickerModalProps) => {
  const [selectedValue, setSelectedValue] = useState(currentValue);

  const handleChange = (event: any, value?: Date) => {
    if (value) {
      setSelectedValue(value);
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedValue);
    onClose();
  };

  const formatSelectedValue = () => {
    if (mode === 'date') {
      return selectedValue.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } else {
      return selectedValue.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.selectedValueContainer}>
            <Text style={styles.selectedValueText}>
              {formatSelectedValue()}
            </Text>
          </View>

          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={selectedValue}
              mode={mode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
              style={styles.picker}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  confirmButton: {
    padding: 5,
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  confirmText: {
    fontSize: 16,
    color: '#00cc99',
    fontWeight: 'bold',
  },
  selectedValueContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  selectedValueText: {
    fontSize: 20,
    fontWeight: '500',
  },
  pickerContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  picker: {
    width: '100%',
  },
});

export default DateTimePickerModal;