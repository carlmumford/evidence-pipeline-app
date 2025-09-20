// This service manages the user's saved list in the browser's localStorage.

const SAVED_LIST_KEY = 'saved_document_list';

export const listService = {
  /**
   * Retrieves the array of saved document IDs from localStorage.
   * @returns An array of strings (document IDs).
   */
  getSavedIds: (): string[] => {
    try {
      const savedList = localStorage.getItem(SAVED_LIST_KEY);
      return savedList ? JSON.parse(savedList) : [];
    } catch (error) {
      console.error("Could not parse saved list from localStorage:", error);
      return [];
    }
  },

  /**
   * Saves an array of document IDs to localStorage.
   * @param ids - The array of document IDs to save.
   */
  _saveIds: (ids: string[]): void => {
    try {
      localStorage.setItem(SAVED_LIST_KEY, JSON.stringify(ids));
    } catch (error) {
      console.error("Could not save list to localStorage:", error);
    }
  },

  /**
   * Toggles the saved state of a document.
   * If the ID is present, it's removed. If it's not, it's added.
   * @param id - The ID of the document to toggle.
   * @returns The new array of saved document IDs.
   */
  toggleSaved: (id: string): string[] => {
    const currentIds = listService.getSavedIds();
    const isSaved = currentIds.includes(id);
    let newIds: string[];

    if (isSaved) {
      newIds = currentIds.filter(savedId => savedId !== id);
    } else {
      newIds = [...currentIds, id];
    }
    
    listService._saveIds(newIds);
    return newIds;
  },
};
