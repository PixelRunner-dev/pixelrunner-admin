<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { t } from 'i18next';

import {
  Alert as DAlert,
  Badge as DBadge,
  Button as DButton,
  Checkbox as DCheckbox,
  Collapse as DCollapse,
  CollapseTitle as DCollapseTitle,
  CollapseContent as DCollapseContent,
  Fieldset as DFieldset,
  Flex as DFlex,
  FormControl as DFormControl,
  Input as DInput,
  Label as DLabel,
  Range as DRange,
  Text as DText,
  Toggle as DToggle
} from '(vendor)/daisy-ui-kit/index.ts';

import { CookieStore } from '@/utils/CookieStore';
import LocationSearch from '@/components/Form/SettingFields/LocationSearch.vue';
import SetLanguage from '@/components/SetLanguage.vue';
import FeatureToggle from '@/components/FeatureToggle.vue';
import DebugSection from '@/components/DebugSection.vue';

import { toCamelCase, toCapitalizeWords, vibrateDevice } from '@/utils/generic.ts';

import {
  serializeSettingValue,
  useSyncedControllerSettings,
  type SyncedControllerSettingBinding
} from '@/composables/useSyncedControllerSettings.ts';
import { useControllerQuery } from '@/composables/useControllerQuery.ts';
import { useClientApi } from '@/ws/index.ts';
import type { WifiConfigureInput, WifiScanNetwork, WifiStatus } from '@/ws/api/settings.ts';
import {
  EXPERIMENTAL_FEATURES_SETTING_KEY,
  FEATURE_TOGGLE_LIST,
  THEMES_DARK,
  THEMES_LIGHT,
  THEMES_OTHER,
  type FeatureToggleKey,
  type FeatureToggleItem
} from '@/constants';
import {
  extractControllerVersionFromStatus,
  getFeatureToggleSettingKey,
  isFeatureSupportedByControllerVersion
} from '@/utils/feature-toggles.ts';

// Get WebSocket functionality
const { device, isConnected, lastError, settings, state } = useClientApi();
const route = useRoute();
const isFirstTimeSetup = computed(() => route.query['first-time'] === '1');

function setTheme(e: Event) {
  const target = e.target as HTMLInputElement | null;
  const val = target?.value;
  if (val) {
    document.documentElement.dataset.theme = val;
    CookieStore.set('theme', val);
  }
}

function setBrightness(e: Event) {
  const target = e.target as HTMLInputElement | null;
  if (!target) return;

  brightness.value = Number(target.value);
}

async function doFirmwareUpdate() {
  console.log('doFirmwareUpdate');

  try {
    const status = await device?.status();
    console.log('Device status:', status);
    // Continue with firmware update logic
  } catch (error) {
    console.error('Failed to get device status:', error);
  }
}

function doFactoryReset() {
  const confirmed = confirm(t('settingsPage.factoryReset.confirm'));
  if (confirmed) {
    console.log('reset device');
    return true;
  }

  console.log('reset device canceled');
  return false;
}

async function doReboot() {
  alert(t('settingsPage.reboot.alert'));
  // setTimeout(() => {
  //   console.log('Rebooting device');
  // }, 3000);
  try {
    const result = await device?.reboot();
    console.log('reboot result', result);
  } catch (error) {
    console.error('Reboot failed:', error);
  }
}

function doShutdown() {
  alert(t('settingsPage.shutdown.alert'));
  setTimeout(() => {
    console.log('Shutdown device');
  }, 3000);
}

function deviceNameOnBeforeInput(e: InputEvent) {
  if (e.data && !/^[A-Za-z0-9_\-]+$/.test(e.data)) e.preventDefault();
}

function deviceNameOnPaste(e: ClipboardEvent) {
  const clipboardData = e?.clipboardData?.getData('text');
  const inputField = e?.target as HTMLInputElement;
  if (clipboardData) inputField.value = clipboardData.replace(/[^A-Za-z0-9_-]/, '');
}

const themesDark = computed<string[]>(() => THEMES_DARK);
const themesLight = computed<string[]>(() => THEMES_LIGHT);
const themesOther = computed<string[]>(() => THEMES_OTHER);

const securityOptions = computed<string[]>(() => [
  'none',
  'wep',
  'wpa',
  'wpa23',
  'wpa3',
  'wpae',
  'wpa2e',
  'wpa3e'
]);

const proxyOptions = computed<string[]>(() => ['none', 'manual', 'auto-config']);

const deviceName = ref(`pxlr_${'f91a'}`);
const date = ref(new Date().toISOString().slice(0, 10));
const time = ref(new Date().toTimeString().slice(0, 5));
const location = ref();
const ssid = ref('');
const security = ref<WifiConfigureInput['security']>('none');
const password = ref('');
const hiddenNetwork = ref(false);
const dhcp = ref<WifiConfigureInput['dhcp']>('dhcp');
const ip = ref('');
const subnet = ref('');
const gateway = ref('');
const dns = ref<WifiConfigureInput['dns']>('auto');
const primaryDns = ref('');
const secondaryDns = ref('');
const proxy = ref('none');
const proxyServer = ref('');
const proxyPort = ref(8080);
const proxyAutoConfig = ref('');
const brightness = ref(42);
const dimAtSunset = ref(false);
const nightMode = ref(false);
const nightModeStart = ref('23:00');
const nightModeEnd = ref('07:00');
const alarmClock = ref(false);
const alarmTime = ref('08:00');
const theme = ref(CookieStore.get('theme') || themesLight.value[0]);
const experimentalFeatures = ref(false);
const controllerVersion = ref<string | null>(null);
const featureToggleModels = Object.fromEntries(
  FEATURE_TOGGLE_LIST.map(({ key }) => [key, ref(false)])
) as Record<FeatureToggleKey, ReturnType<typeof ref<boolean>>>;
const featureToggleRenderKeys = ref(
  Object.fromEntries(FEATURE_TOGGLE_LIST.map(({ key }) => [key, 0])) as Record<
    FeatureToggleKey,
    number
  >
);
const wifiStatus = ref<WifiStatus | null>(null);
const wifiNetworks = ref<WifiScanNetwork[]>([]);
const wifiIsScanning = ref(false);
const wifiIsSaving = ref(false);
const wifiStatusMessage = ref('');
const wifiStatusError = ref('');

const availableFeatureToggleList = computed(() =>
  FEATURE_TOGGLE_LIST.filter((feature) =>
    isFeatureSupportedByControllerVersion(feature, controllerVersion.value)
  )
);

const deviceSettingBindings: SyncedControllerSettingBinding[] = [
  { key: 'deviceName', model: deviceName },
  { key: 'date', model: date },
  { key: 'time', model: time },
  { key: 'location', model: location },
  { key: 'proxy', model: proxy },
  { key: 'proxyServer', model: proxyServer },
  { key: 'proxyPort', model: proxyPort },
  { key: 'proxyAutoConfig', model: proxyAutoConfig },
  { key: 'brightness', model: brightness },
  { key: 'dimAtSunset', model: dimAtSunset },
  { key: 'nightMode', model: nightMode },
  { key: 'nightModeStart', model: nightModeStart },
  { key: 'nightModeEnd', model: nightModeEnd },
  { key: 'alarmClock', model: alarmClock },
  { key: 'alarmTime', model: alarmTime },
  { key: EXPERIMENTAL_FEATURES_SETTING_KEY, model: experimentalFeatures },
  ...FEATURE_TOGGLE_LIST.map((feature) => ({
    key: getFeatureToggleSettingKey(feature.key),
    model: featureToggleModels[feature.key]
  }))
];

const { hasLoadedSettings: hasLoadedDeviceSettings } = useSyncedControllerSettings({
  settings,
  isConnected,
  state,
  lastError,
  bindings: deviceSettingBindings
});

const {
  isLoading: isLoadingFeatureToggleStatus,
  error: featureToggleStatusError,
  isWaitingForPeer: isWaitingForFeatureToggleStatusPeer,
  reload: reloadFeatureToggleStatus
} = useControllerQuery({
  label: 'SettingsPage - feature toggles',
  enabled: isConnected,
  state,
  lastError,
  canLoad: () => Boolean(device),
  skipContext: () => ({ hasDeviceApi: Boolean(device) }),
  load: async () => {
    if (!device) {
      throw new Error('Device API not available');
    }

    return device.status({ full: true });
  },
  defaultErrorMessage: 'Failed to load controller version',
  onSuccess: (status) => {
    controllerVersion.value = extractControllerVersionFromStatus(status);
  }
});

async function confirmPermanentFeature(feature: FeatureToggleItem): Promise<boolean> {
  const ask = window.ask ?? window.confirm;
  const message = `Feature: '${feature.key}' - ${feature.label}\n\nThis experimental feature is marked PERMANENT. Enable it only if you understand it. This feature can change device behavior in a way that cannot be undone from this screen.`;

  return Boolean(await ask(message));
}

function resetFeatureToggleInput(featureKey: FeatureToggleKey): void {
  featureToggleRenderKeys.value[featureKey] += 1;
}

async function saveFeatureToggleSetting(
  featureKey: FeatureToggleKey,
  enabled: boolean
): Promise<void> {
  if (!settings || !isConnected.value) {
    return;
  }

  try {
    await settings.set(getFeatureToggleSettingKey(featureKey), serializeSettingValue(enabled));
  } catch (error) {
    console.error('[SettingsPage] Failed to save feature toggle:', featureKey, error);
  }
}

async function setFeatureToggle(feature: FeatureToggleItem, enabled: boolean): Promise<void> {
  const featureKey = feature.key as FeatureToggleKey;
  const model = featureToggleModels[featureKey];

  if (feature.isPermanent && model.value && !enabled) {
    model.value = true;
    resetFeatureToggleInput(featureKey);
    console.warn('[SettingsPage] Permanent feature cannot be disabled:', feature.key);
    return;
  }

  if (!enabled) {
    model.value = false;
    await saveFeatureToggleSetting(featureKey, false);
    return;
  }

  if (feature.isPermanent) {
    resetFeatureToggleInput(featureKey);

    if (!(await confirmPermanentFeature(feature))) {
      model.value = false;
      resetFeatureToggleInput(featureKey);
      return;
    }
  }

  model.value = true;
  await saveFeatureToggleSetting(featureKey, true);
}

function applyWifiStatus(status: WifiStatus) {
  wifiStatus.value = status;
  ssid.value = status.ssid;
  security.value = status.security === 'unknown' ? 'none' : status.security;
  dhcp.value = status.ipMode === 'unknown' ? 'dhcp' : status.ipMode;
  ip.value = status.addresses[0]?.split('/')[0] || '';
  subnet.value = status.addresses[0]?.split('/')[1] || '';
  gateway.value = status.gateway;
  dns.value = status.dnsServers.length > 0 ? 'manual' : 'auto';
  primaryDns.value = status.dnsServers[0] || '';
  secondaryDns.value = status.dnsServers[1] || '';
  password.value = '';
}

async function loadWifiStatus() {
  if (!settings || !isConnected.value) return;

  try {
    wifiStatusError.value = '';
    applyWifiStatus(await settings.getWifiStatus());
  } catch (error) {
    wifiStatusError.value = error instanceof Error ? error.message : 'Failed to load WiFi status';
  }
}

function getSecurityFromScan(network: WifiScanNetwork): WifiConfigureInput['security'] {
  const value = network.security.toLowerCase();
  if (!value || value === '--') return 'none';
  if (value.includes('wpa3')) return 'wpa3';
  if (value.includes('wpa2') && value.includes('wpa1')) return 'wpa23';
  if (value.includes('wpa')) return 'wpa';
  if (value.includes('wep')) return 'wep';
  return 'wpa';
}

function selectWifiNetwork(network: WifiScanNetwork) {
  ssid.value = network.ssid;
  security.value = getSecurityFromScan(network);
  password.value = '';
  wifiStatusMessage.value = `[Selected ${network.ssid}]`;
  wifiStatusError.value = '';
}

async function loadWifiNetworks() {
  if (!settings || !isConnected.value || wifiIsScanning.value) return;

  wifiIsScanning.value = true;
  wifiStatusError.value = '';

  try {
    wifiNetworks.value = await settings.scanWifiNetworks();
  } catch (error) {
    wifiStatusError.value = error instanceof Error ? error.message : 'Failed to scan WiFi networks';
  } finally {
    wifiIsScanning.value = false;
  }
}

async function saveWifiNetwork() {
  if (!settings || wifiIsSaving.value) return;

  wifiIsSaving.value = true;
  wifiStatusError.value = '';
  wifiStatusMessage.value = '';

  try {
    const status = await settings.configureWifi({
      ssid: ssid.value,
      security: security.value,
      password: password.value,
      hiddenNetwork: hiddenNetwork.value,
      dhcp: dhcp.value,
      ip: ip.value,
      subnet: subnet.value,
      gateway: gateway.value,
      dns: dns.value,
      primaryDns: primaryDns.value,
      secondaryDns: secondaryDns.value
    });

    applyWifiStatus(status);
    wifiStatusMessage.value =
      '[WiFi configured. Device may disconnect from setup network while it joins the target network.]';
  } catch (error) {
    wifiStatusError.value = error instanceof Error ? error.message : 'Failed to configure WiFi';
  } finally {
    wifiIsSaving.value = false;
  }
}

const uniqueWifiNetworks = computed(() => {
  return [...new Set(wifiNetworks.value)];
});

onMounted(() => {
  void loadWifiStatus();
  void loadWifiNetworks();
});

watch(isConnected, (connected) => {
  if (connected) {
    void loadWifiStatus();
    void loadWifiNetworks();
  }
});

watchEffect(() => {
  if (brightness.value % 25 === 0 || brightness.value === 1) vibrateDevice(15);
  else vibrateDevice(1);
});
</script>

<template>
  <main class="site-wrapper">
    <DText is="h1" size="5xl" class="my-4">{{ toCapitalizeWords(String($route.name)) }}</DText>

    <template v-if="!isFirstTimeSetup">
      <DAlert info role="alert" class="my-4">
        <svg
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="h-6 w-6 shrink-0 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <DText>{{ $t('settingsPage.notification.saveInfo') }}</DText>
      </DAlert>

      <DFormControl class="my-4 gap-1">
        <DLabel for="deviceName">
          <DText size="sm">{{ $t('settingsPage.deviceName.label') }}</DText>
        </DLabel>
        <DInput
          id="deviceName"
          type="text"
          :placeholder="$t('settingsPage.deviceName.placeholder')"
          v-model.trim="deviceName"
          validator
          required
          @beforeinput="deviceNameOnBeforeInput"
          @paste.prevent="deviceNameOnPaste"
        />
        <DText is="p" size="xs">{{ $t('settingsPage.deviceName.description') }}</DText>
      </DFormControl>

      <DFieldset :legend="$t('settingsPage.dateAndTime.legend')" class="my-4" disabled>
        <DFormControl class="gap-1">
          <DLabel label>
            <DText>{{ $t('settingsPage.dateAndTime.date.label') }}</DText>
            <DInput
              class="input font-mono"
              type="date"
              name="current-date"
              v-model="date"
              disabled
            />
          </DLabel>
        </DFormControl>

        <DFormControl class="gap-1">
          <DLabel label>
            <DText>{{ $t('settingsPage.dateAndTime.time.label') }}</DText>
            <DInput
              class="input font-mono"
              type="time"
              name="current-time"
              v-model="time"
              disabled
            />
          </DLabel>
        </DFormControl>
      </DFieldset>

      <DFieldset :legend="$t('settingsPage.localization.legend')" class="my-4 gap-4">
        <DFormControl class="gap-1">
          <DLabel for="language">
            <DText size="sm">{{ $t('settingsPage.localization.language.label') }}</DText>
          </DLabel>
          <SetLanguage />
        </DFormControl>

        <DFormControl class="component--location-search gap-1">
          <DLabel for="location">
            <DText size="sm">{{ $t('settingsPage.localization.location.label') }}</DText>
          </DLabel>
          <LocationSearch
            :key="serializeSettingValue(location)"
            id="location"
            v-model="location"
            :default="location"
          />
        </DFormControl>
      </DFieldset>
    </template>

    <DFieldset :legend="$t('settingsPage.wifiNetwork.legend')" class="my-4 gap-4">
      <DAlert v-if="isFirstTimeSetup" info role="alert" class="my-2">
        <DText>
          [Connect this device to WiFi. Other settings unlock after the device joins the network.]
        </DText>
      </DAlert>

      <DAlert v-if="wifiStatusError" error role="alert" class="my-2">
        <DText>{{ wifiStatusError }}</DText>
      </DAlert>

      <DAlert v-if="wifiStatusMessage" success role="status" class="my-2">
        <DText>{{ wifiStatusMessage }}</DText>
      </DAlert>

      <DFormControl class="gap-1">
        <DLabel for="wifi-networks">
          <DText size="sm">[Visible WiFi networks]</DText>
        </DLabel>

        <div
          id="wifi-networks"
          class="grid gap-2 w-80 max-h-[21lh] overflow-y-auto"
          style="scrollbar-width: thin"
        >
          <DButton
            v-for="network in uniqueWifiNetworks"
            :key="network.bssid"
            type="button"
            class="btn-xs items-center cursor-pointer flex justify-between w-full text-left"
            :class="{ 'btn-accent': network.ssid === ssid }"
            :title="
              network.ssid === ssid ? 'Connected network' : `Connect to network '${network.ssid}'`
            "
            :disabled="network.ssid === ssid"
            @click="selectWifiNetwork(network)"
          >
            <span class="font-bold overflow-hidden text-ellipsis whitespace-nowrap">{{
              network.ssid
            }}</span>
            <span class="font-normal text-base-content flex-[0_0_auto] text-xs pl-1">
              {{ network.security || 'open' }} · {{ network.signal ?? '?' }}%
            </span>
          </DButton>

          <DText v-if="!wifiIsScanning && wifiNetworks.length === 0" is="p" size="sm">
            [No visible WiFi networks found.]
          </DText>
        </div>

        <DButton
          btn
          secondary
          sm
          class="w-80"
          :disabled="wifiIsScanning || !isConnected"
          @click="loadWifiNetworks"
          @touchstart="() => vibrateDevice(4)"
          @touchend="() => vibrateDevice(1)"
        >
          {{ wifiIsScanning ? '[Scanning...]' : '[Refresh networks]' }}
        </DButton>
      </DFormControl>

      <DFormControl class="gap-1">
        <DLabel for="ssid">
          <DText size="sm">{{ $t('settingsPage.wifiNetwork.ssid.label') }}</DText>
        </DLabel>
        <DInput
          id="ssid"
          type="text"
          name="ssid"
          v-model="ssid"
          :placeholder="$t('settingsPage.wifiNetwork.ssid.placeholder')"
          validator
          required
        />
      </DFormControl>

      <DFormControl class="gap-1">
        <DLabel for="security">
          <DText size="sm">{{ $t('settingsPage.wifiNetwork.security.label') }}</DText>
        </DLabel>
        <select id="security" name="security" class="select" v-model="security">
          <option v-for="o in securityOptions" :key="o" :value="o" :selected="o === security">
            {{ $t('settingsPage.wifiNetwork.security.options.' + o) }}
          </option>
        </select>
      </DFormControl>

      <DFormControl v-if="security !== 'none'" class="gap-1">
        <DLabel for="password">
          <DText size="sm">{{ $t('settingsPage.wifiNetwork.password.label') }}</DText>
        </DLabel>
        <DInput
          id="password"
          type="password"
          name="password"
          v-model="password"
          :placeholder="$t('settingsPage.wifiNetwork.password.placeholder')"
          validator
          required
        />
      </DFormControl>

      <DCollapse variant="arrow" class="bg-base-100">
        <DCollapseTitle class="font-semibold">
          {{ $t('settingsPage.wifiNetwork.advancedOptions') }}
        </DCollapseTitle>
        <DCollapseContent>
          <DFormControl class="gap-1">
            <DLabel for="hiddenNetwork">
              <DCheckbox id="hiddenNetwork" v-model="hiddenNetwork" name="hidden-network" />
              <DText size="sm">{{ $t('settingsPage.wifiNetwork.hiddenNetwork.label') }}</DText>
            </DLabel>
          </DFormControl>

          <DFieldset
            :legend="$t('settingsPage.wifiNetwork.ipConfiguration.legend')"
            class="my-4 gap-4"
          >
            <DFormControl class="gap-1">
              <DLabel for="dhcp">
                <DText size="sm">{{
                  $t('settingsPage.wifiNetwork.ipConfiguration.dhcp.label')
                }}</DText>
              </DLabel>
              <select id="dhcp" name="dhcp" class="select" v-model="dhcp">
                <option value="dhcp">
                  {{ $t('settingsPage.wifiNetwork.ipConfiguration.dhcp.options.dhcp') }}
                </option>
                <option value="static">
                  {{ $t('settingsPage.wifiNetwork.ipConfiguration.dhcp.options.static') }}
                </option>
              </select>
            </DFormControl>

            <DFormControl class="gap-1">
              <DLabel for="ip">
                <DText size="sm">{{
                  $t('settingsPage.wifiNetwork.ipConfiguration.ip.label')
                }}</DText>
              </DLabel>
              <DInput
                id="ip"
                type="text"
                inputmode="decimal"
                name="ip"
                v-model="ip"
                :placeholder="$t('settingsPage.wifiNetwork.ipConfiguration.ip.placeholder')"
                :readonly="dhcp === 'dhcp'"
                validator
                required
              />
            </DFormControl>

            <template v-if="dhcp === 'static'">
              <DFormControl class="gap-1">
                <DLabel for="gateway">
                  <DText size="sm">{{
                    $t('settingsPage.wifiNetwork.ipConfiguration.gateway.label')
                  }}</DText>
                </DLabel>
                <DInput
                  id="gateway"
                  type="text"
                  inputmode="decimal"
                  name="gateway"
                  v-model="gateway"
                  :placeholder="$t('settingsPage.wifiNetwork.ipConfiguration.gateway.placeholder')"
                  validator
                  required
                />
              </DFormControl>

              <DFormControl class="gap-1">
                <DLabel for="subnet">
                  <DText size="sm">{{
                    $t('settingsPage.wifiNetwork.ipConfiguration.subnet.label')
                  }}</DText>
                </DLabel>
                <DInput
                  id="subnet"
                  type="text"
                  inputmode="decimal"
                  name="subnet"
                  v-model="subnet"
                  :placeholder="$t('settingsPage.wifiNetwork.ipConfiguration.subnet.placeholder')"
                  validator
                  required
                />
              </DFormControl>
            </template>
          </DFieldset>

          <DFieldset
            :legend="$t('settingsPage.wifiNetwork.dnsConfiguration.legend')"
            class="my-4 gap-4"
          >
            <DFormControl class="gap-1">
              <DLabel for="dns">
                <DText size="sm">{{
                  $t('settingsPage.wifiNetwork.dnsConfiguration.dns.label')
                }}</DText>
              </DLabel>
              <select id="dns" name="dns" class="select" v-model="dns">
                <option value="auto">
                  {{ $t('settingsPage.wifiNetwork.dnsConfiguration.dns.options.auto') }}
                </option>
                <option value="manual">
                  {{ $t('settingsPage.wifiNetwork.dnsConfiguration.dns.options.manual') }}
                </option>
              </select>
            </DFormControl>

            <template v-if="dns === 'manual'">
              <DFormControl class="gap-1">
                <DLabel for="primaryDns">
                  <DText size="sm">{{
                    $t('settingsPage.wifiNetwork.dnsConfiguration.primaryDns.label')
                  }}</DText>
                </DLabel>
                <DInput
                  id="primaryDns"
                  type="text"
                  name="primaryDns"
                  v-model="primaryDns"
                  :placeholder="
                    $t('settingsPage.wifiNetwork.dnsConfiguration.primaryDns.placeholder')
                  "
                  validator
                  required
                />
              </DFormControl>

              <DFormControl class="gap-1">
                <DLabel for="secondaryDns">
                  <DText size="sm">{{
                    $t('settingsPage.wifiNetwork.dnsConfiguration.secondaryDns.label')
                  }}</DText>
                </DLabel>
                <DInput
                  id="secondaryDns"
                  type="text"
                  name="secondaryDns"
                  v-model="secondaryDns"
                  :placeholder="
                    $t('settingsPage.wifiNetwork.dnsConfiguration.secondaryDns.placeholder')
                  "
                />
              </DFormControl>
            </template>
          </DFieldset>

          <FeatureToggle features="networkProxy">
            <DFieldset
              :legend="$t('settingsPage.wifiNetwork.proxyConfiguration.legend')"
              class="gap-4"
            >
              <DFormControl class="gap-1">
                <DLabel for="proxy">
                  <DText size="sm">{{
                    $t('settingsPage.wifiNetwork.proxyConfiguration.proxy.label')
                  }}</DText>
                </DLabel>
                <select id="proxy" name="proxy" class="select" v-model="proxy">
                  <option v-for="o in proxyOptions" :key="o" :value="o" :selected="o === proxy">
                    {{
                      $t(
                        'settingsPage.wifiNetwork.proxyConfiguration.proxy.options.' +
                          toCamelCase(o)
                      )
                    }}
                  </option>
                </select>
              </DFormControl>

              <template v-if="proxy === 'manual'">
                <DFormControl class="gap-1">
                  <DLabel for="proxyServer">
                    <DText size="sm">{{
                      $t('settingsPage.wifiNetwork.proxyConfiguration.proxyServer.label')
                    }}</DText>
                  </DLabel>
                  <DInput
                    id="proxyServer"
                    type="text"
                    name="proxyServer"
                    v-model="proxyServer"
                    :placeholder="
                      $t('settingsPage.wifiNetwork.proxyConfiguration.proxyServer.placeholder')
                    "
                    validator
                    required
                  />
                </DFormControl>

                <DFormControl class="gap-1">
                  <DLabel for="proxyPort">
                    <DText size="sm">{{
                      $t('settingsPage.wifiNetwork.proxyConfiguration.proxyPort.label')
                    }}</DText>
                  </DLabel>
                  <DInput
                    id="proxyPort"
                    type="number"
                    name="proxyPort"
                    v-model="proxyPort"
                    :placeholder="
                      $t('settingsPage.wifiNetwork.proxyConfiguration.proxyPort.placeholder')
                    "
                    validator
                    required
                  />
                </DFormControl>
              </template>

              <template v-if="proxy === 'auto-config'">
                <DFormControl class="gap-1">
                  <DLabel for="proxyAutoConfig">
                    <DText size="sm">{{
                      $t('settingsPage.wifiNetwork.proxyConfiguration.proxyAutoConfig.label')
                    }}</DText>
                  </DLabel>
                  <DInput
                    id="proxyAutoConfig"
                    type="url"
                    name="proxyAutoConfig"
                    pattern="^(https?://)?([a-zA-Z0-9]([a-zA-Z0-9-].*[a-zA-Z0-9])?.)+[a-zA-Z].*$"
                    v-model="proxyAutoConfig"
                    :placeholder="
                      $t('settingsPage.wifiNetwork.proxyConfiguration.proxyAutoConfig.placeholder')
                    "
                    validator
                    required
                  />
                </DFormControl>
              </template>
            </DFieldset>
          </FeatureToggle>
        </DCollapseContent>
      </DCollapse>

      <DButton
        btn
        primary
        wide
        :disabled="wifiIsSaving || !isConnected"
        @click="saveWifiNetwork"
        @touchstart="() => vibrateDevice(4)"
        @touchend="() => vibrateDevice(1)"
      >
        {{ wifiIsSaving ? 'Applying WiFi...' : 'Apply WiFi network' }}
      </DButton>
    </DFieldset>

    <template v-if="!isFirstTimeSetup">
      <DFormControl class="my-4 gap-1">
        <DLabel for="brightness">
          <DText size="sm">{{ $t('settingsPage.brightness.label') }} ({{ brightness }}%)</DText>
        </DLabel>
        <DRange
          id="brightness"
          name="brightness"
          v-model="brightness"
          :min="1"
          :max="100"
          :step="1"
          size="sm"
          @input="setBrightness"
        />
        <div class="flex justify-between px-2.5 mt-2 text-xs w-80">
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
          <span>|</span>
        </div>
        <div class="flex justify-between px-2.5 mt-2 text-xs w-80">
          <span>1%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>99%</span>
        </div>
      </DFormControl>

      <FeatureToggle features="dimAtSunset">
        <DFormControl class="my-4 gap-1">
          <DLabel for="dimAtSunset">
            <DCheckbox id="dimAtSunset" name="dim-at-sunset" v-model="dimAtSunset" />
            <DText size="sm">{{ $t('settingsPage.dimAtSunset.label') }}</DText>
          </DLabel>
        </DFormControl>
      </FeatureToggle>

      <FeatureToggle features="nightMode">
        <DFieldset :legend="$t('settingsPage.nightMode.legend')" class="my-4 gap-4">
          <DFormControl class="gap-1">
            <DLabel for="nightMode">
              <DCheckbox
                id="nightMode"
                name="night-mode"
                v-model="nightMode"
                aria-describedby="night-mode-description"
              />
              <DText size="sm">{{ $t('settingsPage.nightMode.label') }}</DText>
            </DLabel>
            <DText is="p" id="night-mode-description">{{
              $t('settingsPage.nightMode.description')
            }}</DText>
          </DFormControl>

          <DFormControl class="gap-1">
            <DLabel input>
              <DText label size="sm">{{ $t('settingsPage.nightMode.nightModeStart.label') }}</DText>
              <DInput
                type="time"
                name="night-mode-start"
                v-model="nightModeStart"
                :disabled="!nightMode"
              />
            </DLabel>
          </DFormControl>

          <DFormControl class="gap-1">
            <DLabel input>
              <DText label size="sm">{{ $t('settingsPage.nightMode.nightModeEnd.label') }}</DText>
              <DInput
                type="time"
                name="night-mode-end"
                v-model="nightModeEnd"
                :disabled="!nightMode"
              />
            </DLabel>
          </DFormControl>

          <FeatureToggle :features="['nightMode', 'alarmClock']">
            <DFieldset
              :legend="$t('settingsPage.nightMode.alarmClock.legend')"
              class="gap-4"
              style="background-color: var(--color-base-100)"
              :disabled="!nightMode"
            >
              <DFormControl class="gap-1">
                <DLabel for="alarmClock">
                  <DCheckbox
                    id="alarmClock"
                    name="alarm-clock"
                    v-model="alarmClock"
                    aria-describedby="alarm-clock-description"
                  />
                  <DText size="sm">{{ $t('settingsPage.nightMode.alarmClock.label') }}</DText>
                </DLabel>
                <DText is="p" id="alarm-clock-description">{{
                  $t('settingsPage.nightMode.alarmClock.description')
                }}</DText>
              </DFormControl>

              <DFormControl class="gap-1">
                <DLabel input>
                  <DText label size="sm">{{
                    $t('settingsPage.nightMode.alarmClock.alarmTime.label')
                  }}</DText>
                  <DInput
                    type="time"
                    name="alarm-time"
                    v-model="alarmTime"
                    :disabled="!alarmClock"
                  />
                </DLabel>
              </DFormControl>
            </DFieldset>
          </FeatureToggle>
        </DFieldset>
      </FeatureToggle>

      <DFormControl class="my-4">
        <DFormControl class="gap-1">
          <DLabel for="theme">
            <DText size="sm">{{ $t('settingsPage.theme.label') }}</DText>
          </DLabel>
          <select id="theme" class="select" v-model="theme" @change="setTheme">
            <optgroup label="Dark themes">
              <option v-for="t in themesDark" :key="'t-' + t" :value="t">
                {{ toCapitalizeWords(t) }}
              </option>
            </optgroup>
            <optgroup label="Light themes">
              <option v-for="t in themesLight" :key="'t-' + t" :value="t">
                {{ toCapitalizeWords(t) }}
              </option>
            </optgroup>
            <optgroup label="Other themes">
              <option v-for="t in themesOther" :key="'t-' + t" :value="t">
                {{ toCapitalizeWords(t) }}
              </option>
            </optgroup>
          </select>
        </DFormControl>
      </DFormControl>

      <DFormControl class="my-4 gap-1">
        <DLabel for="experimentalFeatures">
          <DCheckbox
            id="experimentalFeatures"
            name="experimental-features"
            v-model="experimentalFeatures"
            :disabled="!hasLoadedDeviceSettings"
          />
          <DText size="sm">{{ $t('settingsPage.experimentalFeatures.label') }}</DText>
        </DLabel>
      </DFormControl>

      <DFieldset
        v-if="experimentalFeatures"
        :legend="$t('settingsPage.experimentalFeatures.list.legend')"
        class="gap-4 p-4 border-5 border-warning"
        style="background-color: var(--color-base-100)"
      >
        <DAlert type="warning">
          <DText is="h3" class="font-bold">{{
            $t('settingsPage.experimentalFeatures.list.warning.title')
          }}</DText>
          <DText is="p">{{ $t('settingsPage.experimentalFeatures.list.warning.body') }}</DText>
        </DAlert>

        <DFormControl class="gap-1">
          <dl class="divide-y divide-base-200 text-sm">
            <div v-if="isLoadingFeatureToggleStatus" class="py-2">
              <DText is="p">Loading feature toggles...</DText>
            </div>
            <div v-else-if="isWaitingForFeatureToggleStatusPeer" class="py-2">
              <DText is="p">Waiting for device connection...</DText>
            </div>
            <div v-else-if="featureToggleStatusError" class="flex items-center gap-2 py-2">
              <DText is="p" class="flex-1 text-error">{{ featureToggleStatusError }}</DText>
              <DButton size="xs" color="neutral" @click="reloadFeatureToggleStatus">Retry</DButton>
            </div>
            <div v-else-if="availableFeatureToggleList.length === 0" class="py-2">
              <DText is="p">No experimental features available for this controller version.</DText>
            </div>
            <div
              v-for="feature in availableFeatureToggleList"
              :key="'feature-toggle-' + feature.key"
              class="flex items-center gap-2 py-2"
            >
              <dt class="flex-1">
                <DText is="p">
                  {{ feature.label }}
                  <DBadge v-if="feature.isPermanent" xs warning>PERMANENT</DBadge>
                </DText>
                <DText is="p" size="xs">Since controller {{ feature.sinceVersion }}</DText>
              </dt>
              <dd class="w-12">
                <DToggle
                  :key="
                    'feature-toggle-input-' +
                    feature.key +
                    '-' +
                    featureToggleRenderKeys[feature.key]
                  "
                  :model-value="featureToggleModels[feature.key].value"
                  :disabled="
                    !hasLoadedDeviceSettings ||
                    (feature.isPermanent && featureToggleModels[feature.key].value)
                  "
                  :success="!feature.isPermanent"
                  :error="feature.isPermanent"
                  @update:model-value="(enabled) => setFeatureToggle(feature, Boolean(enabled))"
                />
              </dd>
            </div>
          </dl>
        </DFormControl>
      </DFieldset>
    </template>

    <DFieldset :legend="$t('settingsPage.actions.legend')" class="my-4">
      <DFlex is="div" wrap justifyCenter class="w-80 gap-4">
        <FeatureToggle features="updateDevice">
          <DButton
            btn
            primary
            class="w-full"
            @click="doFirmwareUpdate"
            @touchstart="() => vibrateDevice(4)"
            @touchend="() => vibrateDevice(1)"
          >
            {{ $t('settingsPage.actions.update.button') }}
          </DButton>
        </FeatureToggle>

        <DButton
          btn
          secondary
          class="w-full"
          @click="doShutdown"
          @touchstart="() => vibrateDevice(4)"
          @touchend="() => vibrateDevice(1)"
        >
          {{ $t('settingsPage.actions.shutdown.button') }}
        </DButton>

        <DButton
          btn
          accent
          class="w-full"
          @click="doReboot"
          @touchstart="() => vibrateDevice(4)"
          @touchend="() => vibrateDevice(1)"
        >
          {{ $t('settingsPage.actions.reboot.button') }}
        </DButton>

        <FeatureToggle features="factoryReset">
          <DButton
            btn
            error
            dash
            @click="doFactoryReset"
            @touchstart="() => vibrateDevice(4)"
            @touchend="() => vibrateDevice(1)"
          >
            {{ $t('settingsPage.actions.factoryReset.button') }}
          </DButton>
        </FeatureToggle>
      </DFlex>
    </DFieldset>

    <FeatureToggle features="debug">
      <DebugSection
        :data="{
          isConnected,
          lastError,
          featureConnection: {
            isLoadingFeatureToggleStatus,
            featureToggleStatusError,
            isWaitingForFeatureToggleStatusPeer
          },
          isFirstTimeSetup,
          controllerVersion
        }"
      />
      <DebugSection
        :data="{
          deviceName,
          date,
          time,
          location,
          ssid,
          security,
          password,
          hiddenNetwork,
          dhcp,
          ip,
          subnet,
          gateway,
          dns,
          primaryDns,
          secondaryDns,
          proxy,
          proxyServer,
          proxyPort,
          proxyAutoConfig,
          brightness,
          dimAtSunset,
          nightMode,
          nightModeStart,
          nightModeEnd,
          alarmClock,
          alarmTime,
          theme,
          experimentalFeatures,
          featureToggleModels,
          wifiStatus,
          wifiNetworks,
          wifiIsScanning,
          wifiIsSaving,
          wifiStatusMessage,
          wifiStatusError
        }"
      />
      <DebugSection :data="featureToggleModels" />
    </FeatureToggle>
  </main>
</template>

<style scoped>
input[type='range'] {
  touch-action: pan-x;
}
</style>
