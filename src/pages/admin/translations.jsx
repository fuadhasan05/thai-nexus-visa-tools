
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Search, Edit, Save, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { useError } from '../../components/ErrorNotification';

// removed getStaticProps stub so admin page renders at runtime
export default function AdminTranslations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [pageFilter, setPageFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editedContent, setEditedContent] = useState({});
  const [showOnlyBadTranslations, setShowOnlyBadTranslations] = useState(false);
  const [showDataIntegrityIssues, setShowDataIntegrityIssues] = useState(false); // New state for data integrity
  const queryClient = useQueryClient();
  const { addError, addSuccess } = useError();

  // Check admin access first
  const { data: currentUser } = useQuery({
    queryKey: ['current-user-admin'],
    queryFn: async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      const user = userData?.user;
      if (!user) return null;
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileErr) {
        return { id: user.id, email: user.email };
      }
      return profile;
    }
  });

  const isAdmin = currentUser?.role === 'admin';

  // Redirect if not admin
  if (currentUser && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <GlassCard className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </GlassCard>
      </div>
    );
  }

  const { data: translations = [], isLoading } = useQuery({
    queryKey: ['all-translations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Translation')
        .select('*')
        .order('updated_date', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    initialData: []
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, translated_content }) => {
      return supabase.from('Translation').update({ translated_content }).eq('id', id).select().single();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-translations'] });
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      setEditingId(null);
      setEditedContent({});
      addSuccess("Translation updated successfully!");
    },
    onError: (error) => {
      addError(`Failed to update translation: ${error.message}`);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => {
      return supabase.from('Translation').delete().eq('id', id).select();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-translations'] });
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      addSuccess("Translation deleted successfully!");
    },
    onError: (error) => {
      addError(`Failed to delete translation: ${error.message}`);
    }
  });

  const languageNames = {
    'de': 'German', 'fr': 'French', 'ja': 'Japanese', 'de-ch': 'Swiss German',
    'it': 'Italian', 'nl': 'Dutch', 'sv': 'Swedish', 'zh': 'Chinese',
    'hi': 'Hindi', 'ru': 'Russian', 'ko': 'Korean', 'da': 'Danish',
    'no': 'Norwegian', 'fi': 'Finnish', 'ms': 'Malay', 'tl': 'Filipino',
    'es': 'Spanish', 'pt': 'Portuguese', 'he': 'Hebrew', 'cs': 'Czech',
    'pl': 'Polish', 'hu': 'Hungarian', 'el': 'Greek', 'ro': 'Romanian',
    'uk': 'Ukrainian', 'af': 'Afrikaans', 'my': 'Burmese', 'lo': 'Lao',
    'km': 'Khmer', 'vi': 'Vietnamese'
  };

  const [fixLog, setFixLog] = useState([]);
  const addLog = (message) => {
    setFixLog(prev => [...prev, { message, time: new Date().toLocaleTimeString() }]);
  };

  const fixAllBadTranslationsMutation = useMutation({
    mutationFn: async () => {
      setFixLog([]); // Clear previous logs
      const badTranslations = translations.filter(t => containsEnglish(t.translated_content));

      addLog(`Found ${badTranslations.length} translations with English content`);

      for (const translation of badTranslations) {
        const targetLanguageName = languageNames[translation.target_language] || translation.target_language;
        
        const prompt = `You are a professional translator for a Thailand visa services website.

CRITICAL: You MUST translate EVERYTHING into ${targetLanguageName}. Do NOT leave ANY English words.

CONTEXT:
- Page: ${translation.page_name}
- Section: ${translation.section_context}
- Target Language: ${targetLanguageName}

IMPORTANT: Translate ALL text into ${targetLanguageName}. NO English words allowed.

Content to translate:
${JSON.stringify(translation.content_block, null, 2)}

Return ONLY the fully translated JSON object with NO English.`;

        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('translate', {
            body: JSON.stringify({
              prompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  translated_content: {
                    type: 'object',
                    additionalProperties: true
                  }
                }
              }
            })
          });

          if (fnError) throw fnError;

          const translated = fnData?.translated_content;

          const { error: updErr } = await supabase
            .from('Translation')
            .update({ translated_content: translated, quality_score: 100 })
            .eq('id', translation.id);

          if (updErr) throw updErr;

          addLog(`Fixed translation: ${translation.page_name}:${translation.section_context} (${targetLanguageName})`);
        } catch (error) {
          console.error(`Failed to fix translation ${translation.id}:`, error);
          addError(`Failed to fix translation: ${translation.page_name}:${translation.section_context}`);
          addLog(`ERROR fixing ${translation.page_name}:${translation.section_context}: ${error.message}`);
        }

        // Delay between requests to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return badTranslations.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['all-translations'] });
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      addSuccess(`Successfully fixed ${count} translation${count !== 1 ? 's' : ''}!`);
      addLog(`Fix operation completed. Successfully fixed ${count} translation(s).`);
    },
    onError: (error) => {
      console.error("Error fixing bad translations:", error);
      addError(`Failed to fix translations: ${error.message}`);
      addLog(`Fix operation failed: ${error.message}`);
    }
  });

  // Data integrity check mutation - clean up bad translations
  const cleanupBadDataMutation = useMutation({
    mutationFn: async () => {
      const issues = [];
      
      // Find English-to-English translations (shouldn't exist)
      const englishTranslationsToDelete = translations.filter(t => t.target_language === 'en');
      
      for (const trans of englishTranslationsToDelete) {
        const { error: delErr } = await supabase.from('Translation').delete().eq('id', trans.id);
        if (!delErr) {
          issues.push(`Deleted English→English translation: ${trans.page_name}:${trans.section_context}`);
        } else {
          issues.push(`Failed to delete: ${trans.page_name}:${trans.section_context} - ${delErr.message}`);
        }
      }
      
      // Additional checks could be added here if needed, e.g., missing content_block, etc.
      
      return issues;
    },
    onSuccess: (issues) => {
      queryClient.invalidateQueries({ queryKey: ['all-translations'] });
      queryClient.invalidateQueries({ queryKey: ['translations'] });
      addSuccess(`Cleanup complete! Fixed ${issues.length} issue${issues.length !== 1 ? 's' : ''}`);
    },
    onError: (error) => {
      addError(`Cleanup failed: ${error.message}`);
    }
  });

  // FIXED: Only check VALUES, not JSON keys - using STRICT English word detection
  const containsEnglish = (translatedContent) => {
    if (!translatedContent) return false;
    
    // Extract only VALUES from the object, recursively
    const extractValues = (obj) => {
      let values = [];
      for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'string') {
          values.push(value);
        } else if (Array.isArray(value)) {
          values = values.concat(value.filter(v => typeof v === 'string'));
        } else if (typeof value === 'object' && value !== null) {
          values = values.concat(extractValues(value));
        }
      }
      return values;
    };
    
    const allValues = extractValues(translatedContent).join(' ').toLowerCase();
    
    // Only check for DISTINCTLY English words - avoid short words common in other languages
    const englishWords = [
      'the', 'and', 'with', 'from', 'your', 'our', 'this', 'that',
      'translated', 'translation', 'english', 'have', 'will', 'would', 'should',
      'their', 'these', 'those', 'about', 'which'
    ];
    
    return englishWords.some(word => new RegExp(`\\b${word}\\b`, 'i').test(allValues));
  };

  const uniqueLanguages = [...new Set(translations.map(t => t.target_language))].sort();
  const uniquePages = [...new Set(translations.map(t => t.page_name))].sort();

  const badTranslationsCount = translations.filter(t => containsEnglish(t.translated_content)).length;

  // Data integrity checks
  const englishTranslations = translations.filter(t => t.target_language === 'en');
  const dataIntegrityIssues = englishTranslations.length;

  const filteredTranslations = translations.filter(t => {
    const matchesSearch = 
      t.page_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.section_context.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(t.translated_content).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLanguage = languageFilter === 'all' || t.target_language === languageFilter;
    const matchesPage = pageFilter === 'all' || t.page_name === pageFilter;
    const matchesQuality = !showOnlyBadTranslations || containsEnglish(t.translated_content);
    const matchesDataIssues = !showDataIntegrityIssues || t.target_language === 'en'; // New filter condition
    
    return matchesSearch && matchesLanguage && matchesPage && matchesQuality && matchesDataIssues;
  });

  const handleEdit = (translation) => {
    setEditingId(translation.id);
    setEditedContent(translation.translated_content);
  };

  const handleSave = (id) => {
    // Only allow saving if editedContent is valid JSON (not { _invalid: "..." })
    if (editedContent && !editedContent._invalid) {
      updateMutation.mutate({ id, translated_content: editedContent });
    } else {
      addError("Cannot save: Invalid JSON format in edited content.");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedContent({});
  };

  const handleDelete = (translation) => {
    if (window.confirm(`Delete translation for ${translation.page_name}:${translation.section_context} (${languageNames[translation.target_language]})?`)) {
      deleteMutation.mutate(translation.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <GlassCard className="p-8 text-center" hover={false}>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 mb-4">
          <Globe className="w-4 h-4 text-blue-600" />
          <span className="text-blue-700 text-sm font-medium">Admin Only</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Translation Manager</h1>
        <p className="text-gray-600">View and edit all translations across the platform</p>
      </GlassCard>

      {/* Data Integrity Warning */}
      {dataIntegrityIssues > 0 && (
        <GlassCard className="p-6 bg-red-50 border-red-300">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-900 mb-2">⚠️ Data Integrity Issues Detected</h3>
              <p className="text-red-800 text-sm mb-4">
                Found <strong>{dataIntegrityIssues}</strong> English→English translations that shouldn't exist. 
                These are corrupted records that need to be deleted.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => cleanupBadDataMutation.mutate()}
                  disabled={cleanupBadDataMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  {cleanupBadDataMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cleaning Up...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Delete Bad Translations ({dataIntegrityIssues})
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowDataIntegrityIssues(!showDataIntegrityIssues)}
                  variant="outline"
                  size="sm"
                >
                  {showDataIntegrityIssues ? 'Hide Issues' : 'Show Issues'}
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by page, section, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Pages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              {uniquePages.map(page => (
                <SelectItem key={page} value={page}>{page}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {uniqueLanguages.map(lang => (
                <SelectItem key={lang} value={lang}>
                  {languageNames[lang] || lang} ({lang.toUpperCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {translations.length} translations</span>
            <span>•</span>
            <span>Showing: {filteredTranslations.length}</span>
            {badTranslationsCount > 0 && (
              <>
                <span>•</span>
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {badTranslationsCount} with English content
                </span>
              </>
            )}
            {dataIntegrityIssues > 0 && (
              <>
                <span>•</span>
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {dataIntegrityIssues} corrupted records
                </span>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowOnlyBadTranslations(!showOnlyBadTranslations)}
              variant={showOnlyBadTranslations ? "default" : "outline"}
              size="sm"
              className={showOnlyBadTranslations ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {showOnlyBadTranslations ? 'Showing Bad Only' : 'Show Bad Translations'}
            </Button>

            {badTranslationsCount > 0 && (
              <Button
                onClick={() => fixAllBadTranslationsMutation.mutate()}
                disabled={fixAllBadTranslationsMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {fixAllBadTranslationsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Fix All Bad Translations
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {badTranslationsCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>⚠️ Quality Issue Detected:</strong> {badTranslationsCount} translation(s) contain English words. 
              Click "Fix All Bad Translations" to automatically re-translate them properly.
            </p>
          </div>
        )}

        {(fixAllBadTranslationsMutation.isPending || fixLog.length > 0) && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
            <h4 className="font-semibold text-sm mb-2 text-gray-700">Fix Log:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              {fixLog.map((log, index) => (
                <li key={index} className="flex justify-between items-start">
                  <span>[{log.time}] {log.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>

      {/* Translations List */}
      <div className="space-y-4">
        {isLoading && (
          <GlassCard className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500">Loading translations...</p>
          </GlassCard>
        )}

        {!isLoading && filteredTranslations.length === 0 && (
          <GlassCard className="p-12 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No translations found matching your filters.</p>
          </GlassCard>
        )}

        {filteredTranslations.map((translation) => {
          const hasEnglish = containsEnglish(translation.translated_content);
          const isCorrupted = translation.target_language === 'en'; // Condition for corrupted data
          
          return (
            <GlassCard 
              key={translation.id} 
              className={`p-6 ${isCorrupted ? 'border-2 border-red-500 bg-red-100' : hasEnglish ? 'border-2 border-red-300 bg-red-50' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {translation.page_name}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                      {translation.section_context}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isCorrupted 
                        ? 'bg-red-200 text-red-900' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {languageNames[translation.target_language] || translation.target_language}
                    </span>
                    {isCorrupted && (
                      <span className="px-3 py-1 rounded-full bg-red-300 text-red-900 text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        CORRUPTED DATA
                      </span>
                    )}
                    {hasEnglish && !isCorrupted && (
                      <span className="px-3 py-1 rounded-full bg-red-200 text-red-800 text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Contains English
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(translation.updated_date).toLocaleString()}
                  </p>
                  {isCorrupted && (
                    <p className="text-xs text-red-700 font-semibold mt-2">
                      ⚠️ This is an English→English translation that shouldn't exist. Delete it using the cleanup button above.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {editingId !== translation.id && (
                    <>
                      <Button
                        onClick={() => handleEdit(translation)}
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-600"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleDelete(translation)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        disabled={deleteMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-2" />
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Original Content */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Original (English):
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(translation.content_block, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Translated Content */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Translated ({languageNames[translation.target_language] || translation.target_language}):
                  </h3>
                  
                  {editingId === translation.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editedContent._invalid ? editedContent._invalid : JSON.stringify(editedContent, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditedContent(parsed);
                          } catch (err) {
                            // Allow invalid JSON while typing, store raw string
                            setEditedContent({ _invalid: e.target.value });
                          }
                        }}
                        className={`font-mono text-xs min-h-96 ${editedContent._invalid ? 'border-red-500' : ''}`}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleSave(translation.id)}
                          disabled={updateMutation.isPending || editedContent._invalid}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          size="sm"
                        >
                          {updateMutation.isPending ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                      {editedContent._invalid && (
                        <p className="text-xs text-red-600">Invalid JSON format</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                        {JSON.stringify(translation.translated_content, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Info Box */}
      <GlassCard className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Editing Guidelines:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Maintain the same JSON structure as the original</li>
              <li>• Keep all the same keys - only change the values</li>
              <li>• Preserve HTML tags, special characters, and formatting</li>
              <li>• Changes will be reflected immediately on the live site</li>
              <li>• Invalid JSON will prevent saving</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
