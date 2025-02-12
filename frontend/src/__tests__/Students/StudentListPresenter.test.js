import { StudentListPresenter } from '../../presenters/StudentListPresenter';

describe('StudentListPresenter', () => {
  let presenter;
  let mockStudentService;
  let mockView;

  beforeEach(() => {
    mockStudentService = {
      getAllStudents: jest.fn(),
      deleteStudent: jest.fn(),
      updateStudent: jest.fn()
    };

    mockView = {
      setStudents: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn()
    };

    presenter = new StudentListPresenter(mockStudentService, mockView);
    // Spy on the loadStudents method
    jest.spyOn(presenter, 'loadStudents');
  });

  describe('loadStudents', () => {
    it('should load students and update view', async () => {
      const mockStudents = [
        { id: '1', firstName: 'John', lastName: 'Doe', balance: 0 },
        { id: '2', firstName: 'Jane', lastName: 'Smith', balance: 100 }
      ];
      mockStudentService.getAllStudents.mockResolvedValue(mockStudents);

      await presenter.loadStudents();

      expect(mockView.setLoading).toHaveBeenCalledWith(true);
      expect(mockView.setStudents).toHaveBeenCalledWith(mockStudents);
      expect(mockView.setLoading).toHaveBeenCalledWith(false);
      expect(mockView.setError).not.toHaveBeenCalled();
    });

    it('should handle errors when loading students', async () => {
      const error = new Error('Failed to load');
      mockStudentService.getAllStudents.mockRejectedValue(error);

      await presenter.loadStudents();

      expect(mockView.setError).toHaveBeenCalledWith('Failed to load students');
      expect(mockView.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('deleteStudent', () => {
    it('should not allow deletion of student with balance', async () => {
      await presenter.deleteStudent({ id: '1', balance: 100 });

      expect(mockStudentService.deleteStudent).not.toHaveBeenCalled();
      expect(mockView.setError).toHaveBeenCalledWith(
        'Cannot delete student with outstanding balance'
      );
    });

    it('should delete student with zero balance', async () => {
      const studentId = '1';
      // Store the original loadStudents implementation
      const originalLoadStudents = presenter.loadStudents;
      
      await presenter.deleteStudent({ id: studentId, balance: 0 });

      expect(mockStudentService.deleteStudent).toHaveBeenCalledWith(studentId);
      // Verify loadStudents was called using the spy
      expect(presenter.loadStudents).toHaveBeenCalled();
      
      // Restore original implementation
      presenter.loadStudents = originalLoadStudents;
    });
  });

  describe('updateStudentStatus', () => {
    it('should update student status and reload list', async () => {
      const studentId = '1';
      const newStatus = 'active';
      
      await presenter.updateStudentStatus(studentId, newStatus);

      expect(mockStudentService.updateStudent).toHaveBeenCalledWith(
        studentId,
        { enrollmentStatus: newStatus }
      );
      expect(presenter.loadStudents).toHaveBeenCalled();
    });

    it('should handle errors when updating status', async () => {
      const error = new Error('Update failed');
      mockStudentService.updateStudent.mockRejectedValue(error);

      await presenter.updateStudentStatus('1', 'active');

      expect(mockView.setError).toHaveBeenCalledWith('Failed to update student status');
    });
  });
});