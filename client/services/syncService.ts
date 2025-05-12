import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

/**
 * Service to handle background synchronization with the server
 */
export const syncService = {
  /**
   * Attempt to synchronize any pending operations with the server
   */
  async syncPendingOperations(): Promise<{ success: boolean, synced: number }> {
    try {
      const pendingSyncsStr = await AsyncStorage.getItem('pendingServerSyncs');
      if (!pendingSyncsStr) {
        return { success: true, synced: 0 }; // No pending operations
      }
      
      const pendingSyncs = JSON.parse(pendingSyncsStr);
      if (!pendingSyncs.length) {
        return { success: true, synced: 0 }; // Empty array, no pending operations
      }
      
      console.log(`Found ${pendingSyncs.length} pending sync operations`);
      
      // Keep track of successful syncs to remove them from the queue
      const successfulSyncs: number[] = [];
      
      // Process each pending sync
      for (let i = 0; i < pendingSyncs.length; i++) {
        const sync = pendingSyncs[i];
        
        try {
          // Handle different types of sync operations
          switch (sync.type) {
            case 'googleSignIn':
              await api.post('/google-auth/verify-token', { idToken: sync.idToken });
              console.log('Successfully synced Google sign-in from queue');
              successfulSyncs.push(i);
              break;
              
            // Add more sync types as needed
            
            default:
              console.warn(`Unknown sync type: ${sync.type}`);
          }
        } catch (error) {
          console.error(`Failed to sync operation ${i} of type ${sync.type}:`, error);
          // Continue processing other operations
        }
      }
      
      // Remove successful syncs (in reverse order to maintain indices)
      for (let i = successfulSyncs.length - 1; i >= 0; i--) {
        pendingSyncs.splice(successfulSyncs[i], 1);
      }
      
      // Update the pending syncs in storage
      await AsyncStorage.setItem('pendingServerSyncs', JSON.stringify(pendingSyncs));
      
      return {
        success: true,
        synced: successfulSyncs.length
      };
    } catch (error) {
      console.error('Error syncing pending operations:', error);
      return {
        success: false,
        synced: 0
      };
    }
  }
};

// Export a function to try syncing in the background
export const attemptBackgroundSync = async () => {
  try {
    const result = await syncService.syncPendingOperations();
    if (result.synced > 0) {
      console.log(`Successfully synced ${result.synced} pending operations`);
    }
    return result;
  } catch (error) {
    console.error('Background sync failed:', error);
    return { success: false, synced: 0 };
  }
}; 