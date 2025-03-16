import { sortStudentsByFirstName, sortByName } from './sorting';

describe('Sorting Utilities', () => {
  describe('sortStudentsByFirstName', () => {
    it('should sort students by first name in case-insensitive alphabetical order', () => {
      const students = [
        { id: '1', firstName: 'Zach', lastName: 'Smith' },
        { id: '2', firstName: 'alice', lastName: 'Johnson' },
        { id: '3', firstName: 'Bob', lastName: 'Brown' }
      ];
      
      const sorted = sortStudentsByFirstName(students);
      
      expect(sorted[0].firstName).toBe('alice');
      expect(sorted[1].firstName).toBe('Bob');
      expect(sorted[2].firstName).toBe('Zach');
    });
    
    it('should handle missing first names', () => {
      const students = [
        { id: '1', firstName: 'Zach', lastName: 'Smith' },
        { id: '2', lastName: 'Johnson' }, // Missing firstName
        { id: '3', firstName: 'Bob', lastName: 'Brown' }
      ];
      
      const sorted = sortStudentsByFirstName(students);
      
      // Empty first name should come first
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].firstName).toBe('Bob');
      expect(sorted[2].firstName).toBe('Zach');
    });
    
    it('should handle null or undefined inputs', () => {
      expect(sortStudentsByFirstName(null)).toEqual([]);
      expect(sortStudentsByFirstName(undefined)).toEqual([]);
      expect(sortStudentsByFirstName([])).toEqual([]);
    });
  });
  
  describe('sortByName', () => {
    it('should sort items by name in case-insensitive alphabetical order', () => {
      const items = [
        { id: '1', name: 'Zach Smith' },
        { id: '2', name: 'alice Johnson' },
        { id: '3', name: 'Bob Brown' }
      ];
      
      const sorted = sortByName(items);
      
      expect(sorted[0].name).toBe('alice Johnson');
      expect(sorted[1].name).toBe('Bob Brown');
      expect(sorted[2].name).toBe('Zach Smith');
    });
    
    it('should handle missing names', () => {
      const items = [
        { id: '1', name: 'Zach Smith' },
        { id: '2' }, // Missing name
        { id: '3', name: 'Bob Brown' }
      ];
      
      const sorted = sortByName(items);
      
      // Empty name should come first
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].name).toBe('Bob Brown');
      expect(sorted[2].name).toBe('Zach Smith');
    });
    
    it('should handle null or undefined inputs', () => {
      expect(sortByName(null)).toEqual([]);
      expect(sortByName(undefined)).toEqual([]);
      expect(sortByName([])).toEqual([]);
    });
  });
});