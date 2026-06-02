import { computed, ref, type ComputedRef, type Ref } from 'vue';

import type {
  IAppletConfigurations,
  IAppletSchema,
  ICategory,
  IConnectionState,
  IEventHandler,
  IFullApplet,
  IFullAppletRecord,
  IJsonRpcParams,
  IPlaylist,
  IRequestOptions,
  IWebSocketEventType,
  UUID
} from 'pixelrunner-shared';

class MockJsonRpcError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'JsonRpcError';
  }
}

interface DatabaseMigrationResult {
  code: number | null;
  signal?: string | null;
  stdout?: string;
  stderr?: string;
}

interface SetupStatus {
  databaseExists: boolean;
  wifiConfigured: boolean;
  setupRequired: boolean;
}

interface SettingsRecord {
  id?: number;
  key: string;
  value: string;
}

interface WifiConfigureInput {
  ssid: string;
  security?: 'none' | 'wep' | 'wpa' | 'wpa23' | 'wpa3' | 'wpae' | 'wpa2e' | 'wpa3e';
  password?: string;
  hiddenNetwork?: boolean;
  dhcp?: 'dhcp' | 'static';
  ip?: string;
  subnet?: string;
  gateway?: string;
  dns?: 'auto' | 'manual';
  primaryDns?: string;
  secondaryDns?: string;
}

interface WifiStatus {
  interface: string;
  configured: boolean;
  mode: 'client' | 'access-point' | 'disconnected' | 'unknown';
  activeConnection: string | null;
  ssid: string;
  security: WifiConfigureInput['security'] | 'unknown';
  signal: number | null;
  ipMode: WifiConfigureInput['dhcp'] | 'unknown';
  addresses: string[];
  gateway: string;
  dnsServers: string[];
  setupAccessPointSsid: string;
}

interface WifiScanNetwork {
  bssid: string;
  ssid: string;
  security: string;
  signal: number | null;
  active: boolean;
}

interface AppletActionPayload {
  method?: unknown;
  params?: unknown;
}

interface SettingsActionPayload {
  method?: unknown;
  params?: unknown;
}

interface MockActionResponse<T> {
  method: string;
  data: T;
}

type EventCallback = (payload: unknown) => void;

const MOCK_LATENCY_MS = 80;

const mockDate = new Date('2026-01-01T00:00:00.000Z');

const categories = {
  spotlight: {
    key: 'spotlight',
    icon: { iconId: 'icon--star' as const, alt: 'Spotlight' }
  },
  starterPack: {
    key: 'starter_pack',
    icon: { iconId: 'icon--rocket' as const, alt: 'Starter pack' }
  },
  fireworks: {
    key: 'fireworks',
    icon: { iconId: 'icon--bomb' as const, alt: 'Fireworks' }
  },
  weather: {
    key: 'weather',
    icon: { iconId: 'icon--cloud' as const, alt: 'Weather' }
  },
  alert: {
    key: 'alert',
    icon: { iconId: 'icon--triangle-alert' as const, alt: 'Alert' }
  }
} satisfies Record<string, ICategory>;

const categoryList = Object.values(categories);

export function getRandomCategories(random = Math.random): ICategory[] {
  const shuffledCategories = [...categoryList];

  for (let index = shuffledCategories.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const currentCategory = shuffledCategories[index];
    const swapCategory = shuffledCategories[swapIndex];

    if (!currentCategory || !swapCategory) continue;

    shuffledCategories[index] = swapCategory;
    shuffledCategories[swapIndex] = currentCategory;
  }

  const categoryCount = Math.max(1, Math.ceil(random() * shuffledCategories.length));
  return shuffledCategories.slice(0, categoryCount);
}

export function getRandomBooleanValue(hasMoreWeightOnFalse = false) {
  return Math.random() < (hasMoreWeightOnFalse ? 0.33 : 0.5);
}

function uuid(value: string): UUID {
  return value as UUID;
}

function makeApplet(
  packageName: string,
  name: string,
  summary: string,
  installed = !getRandomBooleanValue(true),
  appletCategories = getRandomCategories()
): IFullApplet {
  return {
    packageName,
    fileName: `${packageName}.star`,
    details: {
      name,
      summary,
      desc: `${summary} Mock data for local admin development and automated tests.`,
      author: 'Pixelrunner',
      isOfficialApplet: getRandomBooleanValue(true)
    },
    defaultImage: {
      src: '/broken-image.webp',
      alt: `${name} preview`,
      dateCreated: mockDate
    },
    categories: appletCategories,
    isInstalled: installed,
    ...(installed && {
      installationDetails: {
        uuid: uuid(`${packageName}-mock-uuid`),
        image: {
          src: `https://applets.pixelrunner.dev/${packageName}.webp`,
          alt: `${name} installed preview`,
          dateCreated: mockDate
        },
        appliedConfigurations: {
          appId: packageName,
          config: {
            title: name,
            enabled: true,
            color: '#ffcc00'
          }
        }
      }
    })
  };
}

function makeZeroByteAlertApplet(): IFullApplet {
  return {
    ...makeApplet(
      'knmialert',
      'KNMIalert',
      'Only displays active live weather alerts by KNMI for The Netherlands.',
      true,
      [categories.weather, categories.alert]
    ),
    installationDetails: {
      uuid: uuid('knmialert-zero-byte-alert-mock-uuid'),
      image: {
        src: '/broken-image.webp',
        alt: 'KNMIalert installed preview',
        dateCreated: mockDate
      },
      appliedConfigurations: {
        appId: 'knmialert',
        config: {
          location: 'Netherlands'
        }
      },
      isHidden: false,
      isPinned: false
    }
  };
}

const mockApplets: IFullApplet[] = [
  makeApplet(
    'clockbyhenry',
    'Clock By Henry',
    'Shows current time on the Pixelrunner display.',
    true,
    [categories.spotlight, categories.starterPack]
  ),
  makeApplet('buienradar', 'Buienradar', 'Shows local conditions and forecast.', true, [
    categories.starterPack
  ]),
  makeApplet('bitcointicker', 'Bitcoin Ticker', 'Tracks Bitcoin price and market movement.', true, [
    categories.spotlight
  ]),
  makeApplet('spotify', 'Spotify Now Playing', 'Displays the current Spotify track.', false, [
    categories.starterPack
  ]),
  makeApplet('textbyt', 'Textbyt', 'Renders a custom message.', true, [categories.fireworks]),
  makeZeroByteAlertApplet(),
  makeApplet('usdebtclock', 'US Debt Clock', 'Shows how much debt the United States has.', false, [
    categories.fireworks,
    categories.spotlight
  ])
];

const mockAppletSchemas = new Map<string, IAppletSchema>([
  [
    'clock',
    {
      version: '1',
      notifications: [],
      schema: [
        {
          type: 'dropdown',
          id: 'format',
          name: 'Format',
          description: 'Clock format',
          icon: 'clock',
          default: '24h',
          options: [
            { display: '24 hour', value: '24h' },
            { display: '12 hour', value: '12h' }
          ]
        },
        {
          type: 'onoff',
          id: 'showSeconds',
          name: 'Show seconds',
          description: 'Show seconds in the clock.',
          icon: 'timer',
          default: true
        }
      ]
    } as unknown as IAppletSchema
  ],
  [
    'buienradar',
    {
      version: '1',
      notifications: [],
      schema: [
        {
          type: 'location',
          id: 'location',
          name: 'Location',
          description: 'Weather location',
          icon: 'map-pin',
          default: { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'NL' }
        }
      ]
    } as unknown as IAppletSchema
  ],
  [
    'clockbyhenry',
    {
      version: '1',
      notifications: [],
      schema: [
        {
          type: 'dropdown',
          id: 'format',
          name: 'Format',
          description: 'Clock format',
          icon: 'clock',
          default: '24h',
          options: [
            { display: '24 hour', value: '24h' },
            { display: '12 hour', value: '12h' }
          ]
        },
        {
          type: 'onoff',
          id: 'showSeconds',
          name: 'Show seconds',
          description: 'Show seconds in the clock.',
          icon: 'timer',
          default: true
        }
      ]
    } as unknown as IAppletSchema
  ],
  [
    'textbyt',
    {
      version: '1',
      notifications: [],
      schema: [
        {
          type: 'text',
          id: 'message',
          name: 'Message',
          description: 'Text to display on screen',
          icon: 'text',
          default: 'Hello World'
        },
        {
          type: 'color',
          id: 'textColor',
          name: 'Text Color',
          description: 'Color of the displayed text',
          icon: 'color',
          default: '#ffffff'
        },
        {
          type: 'datetime',
          id: 'showUntil',
          name: 'Show Until',
          description: 'Hide the applet after this date and time',
          icon: 'calendar',
          default: ''
        },
        {
          type: 'photoselect',
          id: 'background',
          name: 'Background Image',
          description: 'Optional background image',
          icon: 'image',
          default: null
        }
      ]
    } as unknown as IAppletSchema
  ],
  [
    'bitcointicker',
    {
      version: '1',
      notifications: [],
      schema: [
        {
          type: 'locationbased',
          id: 'location',
          name: 'Location',
          description: 'Location used for timezone and currency display',
          icon: 'map-pin',
          default: null
        }
      ]
    } as unknown as IAppletSchema
  ]
]);

const defaultSettings: SettingsRecord[] = [
  { key: 'deviceName', value: 'pxlr_mock' },
  { key: 'date', value: new Date().toISOString().slice(0, 10) },
  { key: 'time', value: new Date().toTimeString().slice(0, 5) },
  {
    key: 'location',
    value: JSON.stringify({ name: 'Amsterdam', lat: 52.3676, lng: 4.9041, country: 'NL' })
  },
  { key: 'proxy', value: 'none' },
  { key: 'proxyServer', value: '' },
  { key: 'proxyPort', value: '8080' },
  { key: 'proxyAutoConfig', value: '' },
  { key: 'brightness', value: '42' },
  { key: 'dimAtSunset', value: 'false' },
  { key: 'nightMode', value: 'false' },
  { key: 'nightModeStart', value: '23:00' },
  { key: 'nightModeEnd', value: '07:00' },
  { key: 'alarmClock', value: 'false' },
  { key: 'alarmTime', value: '08:00' },
  { key: 'experimentalFeatures', value: 'false' }
];

const defaultWifiStatus: WifiStatus = {
  interface: 'wlan0',
  configured: true,
  mode: 'client',
  activeConnection: 'Pixelrunner Lab',
  ssid: 'Pixelrunner Lab',
  security: 'wpa23',
  signal: 82,
  ipMode: 'dhcp',
  addresses: ['192.168.5.42/24'],
  gateway: '192.168.5.1',
  dnsServers: ['1.1.1.1', '8.8.8.8'],
  setupAccessPointSsid: 'Pixelrunner Setup'
};

const defaultWifiNetworks: WifiScanNetwork[] = [
  {
    bssid: '00:11:22:33:44:55',
    ssid: 'Pixelrunner Lab',
    security: 'WPA2',
    signal: 82,
    active: true
  },
  { bssid: '00:11:22:33:44:66', ssid: 'Guest', security: 'WPA2', signal: 61, active: false },
  { bssid: '00:11:22:33:44:77', ssid: 'IoT', security: 'WPA3', signal: 48, active: false }
];

function cloneMockData<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function getParamsRecord(params?: IJsonRpcParams): Record<string, unknown> {
  return params && !Array.isArray(params) ? params : {};
}

function getActionPayload(params?: IJsonRpcParams): AppletActionPayload | SettingsActionPayload {
  return getParamsRecord(params);
}

function createAbortError(): Error {
  return new DOMException('The operation was aborted.', 'AbortError');
}

export class MockRpcClient {
  public readonly state: Ref<IConnectionState> = ref('disconnected');
  public readonly isConnected: ComputedRef<boolean> = computed(
    () => this.state.value === 'connected'
  );
  public readonly isConnecting: ComputedRef<boolean> = computed(
    () => this.state.value === 'connecting'
  );
  public readonly lastError: Ref<Error | null> = ref(null);

  private readonly eventHandlers = new Map<IWebSocketEventType, Set<EventCallback>>();
  private readonly settings = new Map(
    defaultSettings.map((setting) => [setting.key, { ...setting }])
  );
  private readonly applets = cloneMockData(mockApplets);
  private installCounter = 0;
  private wifiStatus = cloneMockData(defaultWifiStatus);
  private activePlaylist: IPlaylist = {
    uuid: uuid('mock-active-playlist'),
    name: 'Mock Playlist',
    applets: this.applets.filter(
      (applet) => applet.isInstalled && applet.installationDetails
    ) as IPlaylist['applets'],
    dateCreated: mockDate,
    dateModified: mockDate
  };

  public async connect(): Promise<void> {
    if (this.state.value === 'connected' || this.state.value === 'connecting') return;

    this.state.value = 'connecting';
    await this.delay();
    this.state.value = 'connected';
    this.lastError.value = null;
    this.emit('connected', { timestamp: Date.now(), reconnectAttempt: 0 });
  }

  public disconnect(): void {
    if (this.state.value === 'disconnected') return;

    this.state.value = 'disconnected';
    this.emit('disconnected', {
      code: 1000,
      reason: 'Mock client disconnect',
      wasClean: true
    });
  }

  public async reconnect(): Promise<void> {
    this.disconnect();
    await this.connect();
  }

  public async request<T = unknown>(
    method: string,
    params?: IJsonRpcParams,
    options?: IRequestOptions
  ): Promise<T> {
    if (!this.isConnected.value) {
      await this.connect();
    }

    await this.delay(options);

    switch (method) {
      case 'device.status':
        return this.deviceStatus() as T;
      case 'device.setupStatus':
        return this.setupStatus() as T;
      case 'device.reboot':
      case 'device.shutdown':
      case 'device.factoryReset':
        return undefined as T;
      case 'device.updateFirmware':
        return this.deviceUpdateStatus() as T;
      case 'device.migrateDatabase':
        return this.migrateDatabase() as T;
      case 'settings.action':
        return this.settingsAction(getActionPayload(params)) as T;
      case 'applets.action':
        return this.appletsAction(getActionPayload(params)) as T;
      case 'applets.setconfig':
        return this.setAppletConfig(params) as T;
      case 'playlists.activePlaylist':
        return cloneMockData(this.activePlaylist) as T;
      case 'playlists.updateOrder':
        return this.updatePlaylistOrder(params) as T;
      default:
        throw new MockJsonRpcError(`Mock method not implemented: ${method}`, 'method_not_found');
    }
  }

  public on<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)?.add(handler as EventCallback);
    return () => this.off(event, handler);
  }

  public off<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): void {
    this.eventHandlers.get(event)?.delete(handler as EventCallback);
  }

  public once<K extends IWebSocketEventType>(event: K, handler: IEventHandler<K>): void {
    const unsubscribe = this.on(event, ((payload: unknown) => {
      unsubscribe();
      (handler as EventCallback)(payload);
    }) as IEventHandler<K>);
  }

  private emit<K extends IWebSocketEventType>(
    event: K,
    payload: Parameters<IEventHandler<K>>[0]
  ): void {
    this.eventHandlers.get(event)?.forEach((handler) => handler(payload));
  }

  private async delay(options?: IRequestOptions): Promise<void> {
    if (options?.signal?.aborted) {
      throw createAbortError();
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(resolve, MOCK_LATENCY_MS);
      const abort = () => {
        window.clearTimeout(timeout);
        reject(createAbortError());
      };

      options?.signal?.addEventListener('abort', abort, { once: true });
      window.setTimeout(() => {
        options?.signal?.removeEventListener('abort', abort);
      }, MOCK_LATENCY_MS);
    });
  }

  private deviceStatus() {
    return {
      id: 1,
      ok: true,
      result: {
        status: 'idle',
        uptime: [12, 345],
        updateAvailable: false,
        cpus: [],
        memory: [256, 512, 1024],
        versions: {
          admin: __ADMIN_BUILD_ID__,
          applets: 'mock',
          controller: '0.0.1-mock',
          shared: 'mock',
          os: 'mock'
        }
      }
    };
  }

  private setupStatus(): SetupStatus {
    return {
      databaseExists: true,
      wifiConfigured: true,
      setupRequired: false
    };
  }

  private deviceUpdateStatus() {
    return {
      id: 1,
      ok: true,
      result: {
        result: {
          admin: 'idle',
          applets: 'idle',
          controller: 'idle',
          shared: 'idle',
          os: 'idle'
        }
      }
    };
  }

  private migrateDatabase(): DatabaseMigrationResult {
    return {
      code: 0,
      stdout: 'Mock database migration completed.',
      stderr: ''
    };
  }

  private settingsAction(payload: SettingsActionPayload): MockActionResponse<unknown> {
    const method = String(payload.method ?? '');
    const params =
      payload.params && typeof payload.params === 'object'
        ? (payload.params as Record<string, unknown>)
        : {};

    if (method === 'getValue') {
      return { method, data: cloneMockData(this.settings.get(String(params.key))) };
    }

    if (method === 'setValue') {
      const key = String(params.key ?? '');
      const value = String(params.value ?? '');
      const record: SettingsRecord = { key, value };
      this.settings.set(key, record);
      return { method, data: cloneMockData(record) };
    }

    if (method === 'getAll') {
      return { method, data: cloneMockData([...this.settings.values()]) };
    }

    if (method === 'getWifiStatus') {
      return { method, data: cloneMockData(this.wifiStatus) };
    }

    if (method === 'scanWifiNetworks') {
      return { method, data: cloneMockData(defaultWifiNetworks) };
    }

    if (method === 'configureWifi') {
      this.wifiStatus = this.configureWifi(params as unknown as WifiConfigureInput);
      return { method, data: cloneMockData(this.wifiStatus) };
    }

    throw new MockJsonRpcError(
      `Mock settings action not implemented: ${method}`,
      'method_not_found'
    );
  }

  private configureWifi(input: WifiConfigureInput): WifiStatus {
    const address =
      input.dhcp === 'static' && input.ip
        ? `${input.ip}/${input.subnet || '24'}`
        : this.wifiStatus.addresses[0];

    return {
      ...this.wifiStatus,
      configured: true,
      mode: 'client',
      activeConnection: input.ssid,
      ssid: input.ssid,
      security: input.security ?? 'none',
      ipMode: input.dhcp ?? 'dhcp',
      addresses: address ? [address] : [],
      gateway: input.gateway || this.wifiStatus.gateway,
      dnsServers:
        input.dns === 'manual'
          ? [input.primaryDns, input.secondaryDns].filter((server): server is string =>
              Boolean(server)
            )
          : []
    };
  }

  private appletsAction(payload: AppletActionPayload): MockActionResponse<unknown> {
    const method = String(payload.method ?? '');
    const params =
      payload.params && typeof payload.params === 'object'
        ? (payload.params as Record<string, unknown>)
        : {};

    if (method === 'getAllAppletsByPlaylistId') {
      const records: IFullAppletRecord[] = this.activePlaylist.applets.map((applet) => ({
        details: applet.details,
        fileName: applet.fileName,
        packageName: applet.packageName,
        installationDetails: applet.installationDetails,
        isInstalled: applet.isInstalled
      }));
      return { method, data: cloneMockData(records) };
    }

    if (method === 'getInstalledAppletByUUID') {
      return {
        method,
        data: cloneMockData(
          this.applets.find((applet) => applet.installationDetails?.uuid === params.uuid) ?? null
        )
      };
    }

    if (method === 'getAppletByPackageName') {
      return {
        method,
        data: cloneMockData(
          this.applets.find((applet) => applet.packageName === params.packageName) ?? null
        )
      };
    }

    if (method === 'getConfig') {
      const applet = this.findAppletForParams(params);
      return {
        method,
        data: cloneMockData({
          appID: applet?.packageName ?? String(params.packageName ?? ''),
          config: applet?.installationDetails?.appliedConfigurations?.config ?? null
        })
      };
    }

    if (method === 'getSchema') {
      return {
        method,
        data: cloneMockData(mockAppletSchemas.get(String(params.packageName)) ?? null)
      };
    }

    if (method === 'installApplet') {
      return { method, data: cloneMockData(this.installApplet(params)) };
    }

    if (method === 'saveAppletConfig') {
      return { method, data: cloneMockData(this.saveAppletConfig(params)) };
    }

    if (method === 'updateAppletVisibility') {
      return { method, data: cloneMockData(this.updateAppletHidden(params)) };
    }

    if (method === 'updateAppletPinned') {
      return { method, data: cloneMockData(this.updateAppletPinned(params)) };
    }

    if (method === 'removeApplet') {
      this.removeApplet(params);
      return { method, data: null };
    }

    if (method === 'getAllApplets') {
      const limit = Number(params.limit) || this.applets.length;
      return { method, data: cloneMockData(this.applets.slice(0, limit)) };
    }

    if (method === 'getAppletsByCategoryKey') {
      const categoryKey = String(params.categoryKey ?? '');
      return {
        method,
        data: cloneMockData(
          this.applets.filter((applet) =>
            applet.categories.some((category) => category.key === categoryKey)
          )
        )
      };
    }

    if (method === 'getAllCategories') {
      return { method, data: cloneMockData(categoryList) };
    }

    throw new MockJsonRpcError(
      `Mock applets action not implemented: ${method}`,
      'method_not_found'
    );
  }

  private findAppletForParams(params: Record<string, unknown>): IFullApplet | undefined {
    if (params.uuid) {
      return this.applets.find((applet) => applet.installationDetails?.uuid === params.uuid);
    }

    return this.applets.find((applet) => applet.packageName === params.packageName);
  }

  private setAppletConfig(params?: IJsonRpcParams): void {
    const record = getParamsRecord(params);
    const applet = this.applets.find(
      (candidate) => candidate.installationDetails?.uuid === record.uuid
    );

    if (!applet?.installationDetails) {
      throw new MockJsonRpcError('Mock applet not installed', 'not_found');
    }

    applet.installationDetails.appliedConfigurations = {
      appId: applet.packageName,
      config: record.config as Record<string, string | number | boolean | object>
    };
  }

  private installApplet(params: Record<string, unknown>): IFullApplet {
    const packageName = String(params.packageName ?? '');
    const applet = this.applets.find((candidate) => candidate.packageName === packageName);

    if (!applet) {
      throw new MockJsonRpcError('Mock applet not found', 'not_found');
    }

    const installedApplet: IFullApplet = {
      ...cloneMockData(applet),
      isInstalled: true,
      installationDetails: {
        uuid: uuid(`mock-installed-${++this.installCounter}-${packageName}`),
        image: applet.installationDetails?.image ?? {
          src: `https://applets.pixelrunner.dev/${packageName}.webp`,
          alt: `${applet.details.name} installed preview`,
          dateCreated: mockDate
        },
        appliedConfigurations: this.getAppliedConfigurations(params, packageName),
        isHidden: false,
        isPinned: false
      }
    };

    this.applets.push(installedApplet);
    this.activePlaylist = {
      ...this.activePlaylist,
      applets: [...this.activePlaylist.applets, installedApplet as IPlaylist['applets'][number]],
      dateModified: new Date()
    };

    return installedApplet;
  }

  private saveAppletConfig(params: Record<string, unknown>): IFullApplet {
    const applet = this.applets.find(
      (candidate) => candidate.installationDetails?.uuid === params.uuid
    );

    if (!applet?.installationDetails) {
      throw new MockJsonRpcError('Mock applet not installed', 'not_found');
    }

    applet.installationDetails.appliedConfigurations = this.getAppliedConfigurations(
      params,
      applet.packageName
    );

    this.activePlaylist = {
      ...this.activePlaylist,
      applets: this.activePlaylist.applets.map((playlistApplet) =>
        playlistApplet.installationDetails.uuid === params.uuid
          ? (applet as IPlaylist['applets'][number])
          : playlistApplet
      ),
      dateModified: new Date()
    };

    return applet;
  }

  private updateAppletHidden(params: Record<string, unknown>): IFullApplet {
    return this.updateInstalledAppletBoolean(params, 'isHidden');
  }

  private updateAppletPinned(params: Record<string, unknown>): IFullApplet {
    return this.updateInstalledAppletBoolean(params, 'isPinned');
  }

  private updateInstalledAppletBoolean(
    params: Record<string, unknown>,
    field: 'isHidden' | 'isPinned'
  ): IFullApplet {
    const applet = this.applets.find(
      (candidate) => candidate.installationDetails?.uuid === params.uuid
    );

    if (!applet?.installationDetails) {
      throw new MockJsonRpcError('Mock applet not installed', 'not_found');
    }

    const value = params[field];
    if (typeof value !== 'boolean') {
      throw new MockJsonRpcError(`${field} must be a boolean`, 'invalid_params');
    }

    applet.installationDetails[field] = value;
    this.activePlaylist = {
      ...this.activePlaylist,
      applets: this.activePlaylist.applets
        .map((playlistApplet) =>
          playlistApplet.installationDetails.uuid === params.uuid
            ? (applet as IPlaylist['applets'][number])
            : playlistApplet
        )
        .sort(
          (first, second) =>
            Number(second.installationDetails.isPinned) - Number(first.installationDetails.isPinned)
        ),
      dateModified: new Date()
    };

    return applet;
  }

  private removeApplet(params: Record<string, unknown>): void {
    const uuidValue = params.uuid;
    const previousLength = this.activePlaylist.applets.length;

    this.activePlaylist = {
      ...this.activePlaylist,
      applets: this.activePlaylist.applets.filter(
        (applet) => applet.installationDetails.uuid !== uuidValue
      ),
      dateModified: new Date()
    };

    if (this.activePlaylist.applets.length === previousLength) {
      throw new MockJsonRpcError('Mock applet not installed', 'not_found');
    }
  }

  private getAppliedConfigurations(
    params: Record<string, unknown>,
    fallbackAppId: string
  ): IAppletConfigurations {
    const candidate = params.appliedConfigurations;

    if (!candidate || typeof candidate !== 'object') {
      return {
        appId: fallbackAppId,
        config: {}
      };
    }

    const appliedConfigurations = candidate as Partial<IAppletConfigurations>;

    return {
      appId: appliedConfigurations.appId || fallbackAppId,
      config:
        appliedConfigurations.config && typeof appliedConfigurations.config === 'object'
          ? appliedConfigurations.config
          : {}
    };
  }

  private updatePlaylistOrder(params?: IJsonRpcParams) {
    const appletUuids = getParamsRecord(params).appletUuids;
    if (!Array.isArray(appletUuids)) {
      throw new MockJsonRpcError('appletUuids must be an array', 'invalid_params');
    }

    const orderedApplets = appletUuids
      .map((candidateUuid) =>
        this.activePlaylist.applets.find(
          (applet) => applet.installationDetails.uuid === candidateUuid
        )
      )
      .filter((applet): applet is IPlaylist['applets'][number] => Boolean(applet));

    if (orderedApplets.length !== this.activePlaylist.applets.length) {
      throw new MockJsonRpcError('Mock playlist order misses installed applets', 'invalid_params');
    }

    this.activePlaylist = {
      ...this.activePlaylist,
      applets: orderedApplets,
      dateModified: new Date()
    };

    return {
      ok: true,
      appletUuids,
      updatedCount: orderedApplets.length
    };
  }
}
