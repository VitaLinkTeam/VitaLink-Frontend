// services/phoneStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const PHONE_STORAGE_KEY = 'user_phones';

export interface PhoneData {
  [uid: string]: string;
}

export const PhoneStorage = {
  // Guardar o actualizar número de teléfono
  async savePhone(uid: string, phone: string): Promise<void> {
    try {
      const existingData = await this.getPhones();
      const updatedData = {
        ...existingData,
        [uid]: phone
      };
      await AsyncStorage.setItem(PHONE_STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving phone:', error);
      throw error;
    }
  },

  // Obtener todos los números
  async getPhones(): Promise<PhoneData> {
    try {
      const data = await AsyncStorage.getItem(PHONE_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting phones:', error);
      return {};
    }
  },

  // Obtener número específico
  async getPhone(uid: string): Promise<string | null> {
    const data = await this.getPhones();
    return data[uid] || null;
  },

  // Eliminar número
  async removePhone(uid: string): Promise<void> {
    try {
      const data = await this.getPhones();
      delete data[uid];
      await AsyncStorage.setItem(PHONE_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error removing phone:', error);
      throw error;
    }
  }
};