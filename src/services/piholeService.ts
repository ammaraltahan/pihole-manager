import { store } from '../store';
import { piHoleApi } from '../store/api/piholeApi';

class PiHoleService {
  // Convenience methods for common operations
  
  async testConnectionAndAuth(baseUrl: string, password?: string): Promise<{
    isConnected: boolean;
    requiresAuth: boolean;
    isAuthenticated: boolean;
  }> {
    try {
      // Test basic connection
      const { data: isConnected, error: connectionError } = await store.dispatch(
        piHoleApi.endpoints.testConnection.initiate({ baseUrl })
      );

      if (!isConnected) {
        console.error('Connection error:', connectionError);
        return { isConnected: false, requiresAuth: false, isAuthenticated: false };
      }

      // Check if authentication is required
      const { data: authStatus } = await store.dispatch(
        piHoleApi.endpoints.checkAuthRequired.initiate()
      );

      const requiresAuth = authStatus?.session?.valid === false || false;
      
      // If auth is required and password provided, try to login
      let isAuthenticated = false;
      if (requiresAuth && password) {
        const { data: loginResult } = await store.dispatch(
          piHoleApi.endpoints.login.initiate({ password })
        );
        isAuthenticated = loginResult?.session?.valid || false;
      }

      return {
        isConnected: true,
        requiresAuth,
        isAuthenticated
      };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { isConnected: false, requiresAuth: false, isAuthenticated: false };
    }
  }

  // Helper to quickly get current status
  async getQuickStatus() {
    try {
      const [summary, blockingStatus] = await Promise.all([
        store.dispatch(piHoleApi.endpoints.getSummary.initiate()).unwrap(),
        store.dispatch(piHoleApi.endpoints.getBlockingStatus.initiate()).unwrap()
      ]);
      
      return {
        summary,
        blockingStatus,
        isEnabled: blockingStatus?.enabled ?? false
      };
    } catch (error) {
      console.error('Failed to get quick status:', error);
      return null;
    }
  }

  // Bulk refresh of all data
  async refreshAllData() {
    try {
      await Promise.all([
        store.dispatch(piHoleApi.endpoints.getSummary.initiate()),
        store.dispatch(piHoleApi.endpoints.getBlockingStatus.initiate()),
        store.dispatch(piHoleApi.endpoints.getRecentBlocked.initiate())
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }
}

export default new PiHoleService();