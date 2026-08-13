<script setup lang="ts">
import { formatNumber } from "../composables/useCalculator";
import { useI18n } from "../composables/useI18n";

defineProps<{
  total: number | null;
  count: number;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="summary-bar">
    <div class="summary-info">
      <span v-if="count > 0">{{ count }} {{ t("items") }}</span>
      <span v-else>{{ t("noCalculations") }}</span>
    </div>
    <div class="summary-total">
      <span class="summary-label">{{ t("total") }}</span>
      <span class="summary-value">{{ total !== null ? formatNumber(total) : "—" }}</span>
    </div>
  </div>
</template>

<style scoped>
.summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: var(--bg-summary);
  border-top: 1px solid var(--border-summary);
}

.summary-info {
  font-size: 12px;
  color: var(--text-muted);
}

.summary-total {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.summary-label {
  font-size: 12px;
  color: var(--text-label);
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
</style>
