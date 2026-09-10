import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { useLanguage } from '@/src/providers/LanguageProvider';
import { monthlyReportPdfService } from '@/src/services/monthlyReportPdfService';
import { getErrorMessage } from '@/src/core/utils/errors';

export function useExportMonthlyReport(month?: number, year?: number) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  return useMutation({
    mutationFn: () =>
      monthlyReportPdfService.generateAndShare(
        user!.id,
        profile?.full_name ?? t('common.user'),
        profile?.currency ?? 'MXN',
        month,
        year,
      ),
    onError: (e) => Alert.alert(t('reports.exportError'), getErrorMessage(e)),
  });
}
