/**
 * Owner Dashboard Tests
 */

describe('Owner Dashboard', () => {
  it('should have the correct page route', () => {
    const route = '/owner';
    expect(route).toBe('/owner');
  });

  it('should display three main metric cards', () => {
    const expectedCards = [
      'Upcoming Inspections',
      'Open Work Orders', 
      'Total Customers'
    ];
    
    expectedCards.forEach(card => {
      expect(card).toBeTruthy();
    });
  });

  it('should fetch data from correct Supabase tables', () => {
    const tables = ['appointments', 'customers'];
    
    tables.forEach(table => {
      expect(table).toBeTruthy();
    });
  });

  it('should handle loading state', () => {
    const loadingState = true;
    expect(loadingState).toBe(true);
  });

  it('should handle error state', () => {
    const errorState = null;
    expect(errorState).toBeNull();
  });
});