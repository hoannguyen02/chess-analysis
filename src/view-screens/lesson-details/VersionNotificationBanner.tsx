import { VscInfo } from 'react-icons/vsc';

export const VersionNotificationBanner = ({
  currentVersion,
  completedAtVersion,
  onDismiss,
}: {
  currentVersion: number;
  completedAtVersion: number;
  onDismiss: () => void;
}) => {
  return (
    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center">
        {/* VSC Info Icon */}
        <VscInfo className="text-blue-600 w-6 h-6 mr-3" />
        <div>
          <p className="text-blue-800 font-medium">
            This lesson has been updated.
          </p>
          <p className="text-sm text-blue-700">
            Your progress was based on version
            <strong> {completedAtVersion}</strong>, but the current version is{' '}
            <strong>{currentVersion}</strong>.
          </p>
        </div>
      </div>
      <div className="mt-3 flex space-x-2">
        <button
          onClick={onDismiss}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
