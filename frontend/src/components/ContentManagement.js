import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

const ContentManagement = () => {
  const [contentItems, setContentItems] = useState([]);
  const [selectedContentType, setSelectedContentType] = useState('hero_section');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: ''
  });

  const contentTypes = [
    { value: 'hero_section', label: 'Hero Section' },
    { value: 'about_page', label: 'About Page' },
    { value: 'faq_page', label: 'FAQ Page' },
    { value: 'footer', label: 'Footer' },
    { value: 'ui_text', label: 'UI Text' }
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'pt', name: 'Portuguese', flag: '🇧🇷' }
  ];

  useEffect(() => {
    fetchContentItems();
  }, []);

  const fetchContentItems = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`
        }
      });
      const data = await response.json();
      setContentItems(data.content_items || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setLoading(false);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setIsEditing(false);
    
    // Initialize edit form with current language content
    const langContent = item.languages[editingLanguage] || { title: '', content: '' };
    setEditForm({
      title: langContent.title || '',
      content: langContent.content || ''
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    const langContent = selectedItem?.languages[editingLanguage] || { title: '', content: '' };
    setEditForm({
      title: langContent.title || '',
      content: langContent.content || ''
    });
  };

  const handleSave = async () => {
    if (!selectedItem) return;
    
    setSaving(true);
    try {
      // Prepare updated languages object
      const updatedLanguages = {
        ...selectedItem.languages,
        [editingLanguage]: {
          title: editForm.title,
          content: editForm.content
        }
      };

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/content/${selectedItem.content_type}/${selectedItem.section_key}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('session_token')}`
          },
          body: JSON.stringify({
            languages: updatedLanguages
          })
        }
      );

      if (response.ok) {
        // Update local state
        const updatedItem = {
          ...selectedItem,
          languages: updatedLanguages,
          updated_at: new Date().toISOString()
        };
        
        setSelectedItem(updatedItem);
        setContentItems(prev => 
          prev.map(item => 
            item.id === selectedItem.id ? updatedItem : item
          )
        );
        
        setIsEditing(false);
        alert('Content saved successfully!');
      } else {
        throw new Error('Failed to save content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLanguageChange = (langCode) => {
    setEditingLanguage(langCode);
    if (selectedItem) {
      const langContent = selectedItem.languages[langCode] || { title: '', content: '' };
      setEditForm({
        title: langContent.title || '',
        content: langContent.content || ''
      });
    }
  };

  const handleCreateNew = async () => {
    const sectionKey = prompt('Enter section key (e.g., "hero_title", "footer_copyright"):');
    if (!sectionKey) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/content?content_type=${selectedContentType}&section_key=${sectionKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('session_token')}`
          },
          body: JSON.stringify({
            languages: {
              en: { title: '', content: '' },
              es: { title: '', content: '' },
              pt: { title: '', content: '' }
            }
          })
        }
      );

      if (response.ok) {
        fetchContentItems();
        alert('Content item created successfully!');
      } else {
        throw new Error('Failed to create content item');
      }
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Error creating content item. Please try again.');
    }
  };

  const filteredItems = contentItems.filter(item => item.content_type === selectedContentType);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Management</h1>
        <p className="text-gray-600">Manage all your site content across multiple languages with WYSIWYG editing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Content Type Selector */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Content Types</h3>
            <div className="space-y-2">
              {contentTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setSelectedContentType(type.value)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedContentType === type.value
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleCreateNew}
              className="w-full mt-4 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add New Item
            </button>
          </div>
        </div>

        {/* Content Items List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              {contentTypes.find(t => t.value === selectedContentType)?.label} Items ({filteredItems.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedItem?.id === item.id
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-sm">{item.section_key}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Updated: {new Date(item.updated_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {languages.map(lang => (
                      <span
                        key={lang.code}
                        className={`text-xs px-2 py-1 rounded ${
                          item.languages[lang.code]?.title || item.languages[lang.code]?.content
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {lang.flag} {lang.code.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div className="text-gray-500 text-center py-8">
                  No content items found for this type.
                  <br />
                  <button
                    onClick={handleCreateNew}
                    className="text-blue-600 hover:underline mt-2"
                  >
                    Create the first one
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold">{selectedItem.section_key}</h3>
                  <p className="text-sm text-gray-600">
                    Type: {contentTypes.find(t => t.value === selectedItem.content_type)?.label}
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={handleStartEdit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Content
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Editing Language:
                </label>
                <div className="flex gap-2">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        editingLanguage === lang.code
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {lang.flag} {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  {/* Title Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title ({languages.find(l => l.code === editingLanguage)?.name}):
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter title..."
                    />
                  </div>

                  {/* Content Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content ({languages.find(l => l.code === editingLanguage)?.name}):
                    </label>
                    <RichTextEditor
                      content={editForm.content}
                      onChange={(content) => setEditForm(prev => ({ ...prev, content }))}
                      placeholder="Enter content..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Preview Mode */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Title ({languages.find(l => l.code === editingLanguage)?.name}):
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {selectedItem.languages[editingLanguage]?.title || (
                        <span className="text-gray-500 italic">No title set</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Content ({languages.find(l => l.code === editingLanguage)?.name}):
                    </h4>
                    <div className="p-3 bg-gray-50 rounded-lg min-h-[200px]">
                      {selectedItem.languages[editingLanguage]?.content ? (
                        <div dangerouslySetInnerHTML={{ 
                          __html: selectedItem.languages[editingLanguage].content 
                        }} />
                      ) : (
                        <span className="text-gray-500 italic">No content set</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select Content to Edit</h3>
                <p className="text-gray-600">
                  Choose a content type and then select an item to start editing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;