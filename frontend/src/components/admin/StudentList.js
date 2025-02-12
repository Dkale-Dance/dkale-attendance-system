import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

const StudentList = ({
  presenter,
  students = [],
  isLoading = false,
  error = ''
}) => {
  useEffect(() => {
    presenter.loadStudents();
  }, [presenter]);

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4">Students</h2>
      <div className="space-y-4">
        {students.map(student => (
          <div key={student.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">
                  {student.firstName} {student.lastName}
                </h3>
                <p className="text-sm text-gray-600">{student.email}</p>
                <div className="mt-2">
                  <select
                    value={student.enrollmentStatus}
                    onChange={(e) => presenter.updateStudentStatus(student.id, e.target.value)}
                    className="text-sm border rounded p-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <p className="text-sm mt-1">
                  Balance: ${student.balance.toFixed(2)}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => presenter.deleteStudent(student)}
                  disabled={student.balance > 0}
                  className={`px-3 py-1 text-sm text-white rounded ${
                    student.balance > 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

StudentList.propTypes = {
  presenter: PropTypes.shape({
    loadStudents: PropTypes.func.isRequired,
    deleteStudent: PropTypes.func.isRequired,
    updateStudentStatus: PropTypes.func.isRequired
  }).isRequired,
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      firstName: PropTypes.string.isRequired,
      lastName: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      enrollmentStatus: PropTypes.string.isRequired,
      balance: PropTypes.number.isRequired
    })
  ),
  isLoading: PropTypes.bool,
  error: PropTypes.string
};

export default StudentList;