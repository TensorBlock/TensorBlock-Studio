import React, { useEffect, useState } from 'react';
import { DatabaseIntegrationService } from '../../services/database-integration';

interface DatabaseInitializerProps {
  children: React.ReactNode;
}

/**
 * Component that initializes the database when the app starts
 * Should be used near the root of the app to ensure database is ready before other components need it
 */
const DatabaseInitializer: React.FC<DatabaseInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        const dbService = DatabaseIntegrationService.getInstance();
        await dbService.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err : new Error('Unknown database error'));
      }
    };

    initDatabase();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="mb-4 text-xl font-bold text-red-600">Database Error</h2>
          <p className="mb-4 text-gray-700">
            There was a problem initializing the database. This might be due to browser permissions or storage issues.
          </p>
          <p className="p-3 mb-4 text-sm bg-gray-100 rounded">
            Error: {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-opacity-50 rounded-full animate-bounce" />
          <p className="mt-4 text-lg text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DatabaseInitializer; 