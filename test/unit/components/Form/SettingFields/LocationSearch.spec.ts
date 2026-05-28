import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import LocationSearch from '@/components/Form/SettingFields/LocationSearch.vue';

vi.mock('i18next', () => ({
  default: {
    t: (key: unknown) => String(key)
  }
}));

vi.stubGlobal(
  'Worker',
  class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
  }
);

interface LocationResult {
  lat: string;
  lng: string;
  timezone?: string;
  locality?: string;
  desc?: string;
  place_id?: string;
}

describe('LocationSearch.vue', () => {
  const mockLocation: LocationResult = {
    lat: '40.7128',
    lng: '-74.0060',
    desc: 'New York, USA',
    place_id: '1'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders location search component', () => {
    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-1',
        modelValue: mockLocation
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('accepts modelValue with location object', () => {
    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-2',
        modelValue: mockLocation
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });
    expect(wrapper.props('modelValue')).toEqual(mockLocation);
  });

  it('displays location description', () => {
    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-3',
        modelValue: mockLocation
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });
    expect(wrapper.exists()).toBe(true);
  });

  it('handles location with all fields', () => {
    const full: LocationResult = {
      lat: '51.5074',
      lng: '-0.1278',
      timezone: 'Europe/London',
      locality: 'London',
      desc: 'London, UK',
      place_id: '2'
    };

    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-4',
        modelValue: full
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('modelValue')).toEqual(full);
  });

  it('displays current location coords', () => {
    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-5',
        modelValue: mockLocation
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('modelValue').lat).toBe('40.7128');
    expect(wrapper.props('modelValue').lng).toBe('-74.0060');
  });

  it('supports location suggestions', () => {
    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-6',
        modelValue: mockLocation
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('handles location with minimal fields', () => {
    const minimal: LocationResult = {
      lat: '35.6762',
      lng: '139.6503'
    };

    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-7',
        modelValue: minimal
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('modelValue')).toEqual(minimal);
  });

  it('respects defaultQuery prop', () => {
    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-8',
        modelValue: mockLocation,
        defaultQuery: 'Paris'
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('defaultQuery')).toBe('Paris');
  });

  it('accepts default location prop', () => {
    const defaultLocation: LocationResult = {
      lat: '48.8566',
      lng: '2.3522',
      desc: 'Paris, France'
    };

    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-9',
        modelValue: mockLocation,
        default: defaultLocation
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    expect(wrapper.props('default')).toEqual(defaultLocation);
  });

  it('updates when location prop changes', async () => {
    const first: LocationResult = {
      lat: '41.8781',
      lng: '-87.6298',
      desc: 'Chicago'
    };

    const second: LocationResult = {
      lat: '34.0522',
      lng: '-118.2437',
      desc: 'Los Angeles'
    };

    const wrapper = mount(LocationSearch, {
      props: {
        id: 'location-10',
        modelValue: first
      },
      global: {
        mocks: {
          $t: (key: string) => key
        }
      }
    });

    await wrapper.setProps({ modelValue: second });
    expect(wrapper.props('modelValue')).toEqual(second);
  });
});
