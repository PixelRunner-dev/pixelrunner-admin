import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import SiteNotifications from '@/components/SiteNotifications.vue';

import type { Notification } from '@/utils/notifications.ts';

// V8 records Vue template v-if branches with generated null slots for this SFC.
// The tests below cover the observable empty/non-empty and action/non-action paths.
vi.mock('(vendor)/daisy-ui-kit/index.ts', () => ({
  Alert: {
    props: {
      horizontal: Boolean,
      role: String,
      type: String
    },
    template:
      '<section data-testid="alert" :data-horizontal="String(Boolean(horizontal))" :data-type="type" :role="role"><slot /></section>'
  },
  Button: {
    emits: ['click'],
    props: {
      sm: Boolean,
      type: String
    },
    template:
      '<button data-testid="button" :data-sm="String(Boolean(sm))" :type="type" @click="$emit(\'click\', $event)"><slot /></button>'
  },
  Text: {
    template: '<p data-testid="text"><slot /></p>'
  }
}));

describe('SiteNotifications', () => {
  it('renders no wrapper when there are no notifications', () => {
    const wrapper = mountNotifications([]);

    expect(wrapper.find('[data-testid="notifications-wrapper"]').exists()).toBe(false);
    expect(wrapper.text()).toBe('');
  });

  it('renders notification alerts with type, role, horizontal layout and message text', () => {
    const wrapper = mountNotifications([
      createNotification('Saved successfully', { type: 'success' }),
      createNotification('Controller unavailable', { type: 'error' })
    ]);
    const alerts = wrapper.findAll('[data-testid="alert"]');

    expect(wrapper.get('.site-wrapper').classes()).toEqual(['site-wrapper', 'my-8']);
    expect(alerts).toHaveLength(2);
    expect(alerts[0]?.attributes()).toEqual(
      expect.objectContaining({
        'data-horizontal': 'true',
        'data-type': 'success',
        role: 'alert'
      })
    );
    expect(alerts[1]?.attributes('data-type')).toBe('error');
    expect(wrapper.text()).toContain('Saved successfully');
    expect(wrapper.text()).toContain('Controller unavailable');
  });

  it('renders and triggers action buttons only when label and handler are both present', async () => {
    const retry = vi.fn();
    const wrapper = mountNotifications([
      createNotification('Retry available', {
        actionLabel: 'Retry',
        onAction: retry,
        type: 'warning'
      }),
      createNotification('Label only', {
        actionLabel: 'Missing handler',
        type: 'info'
      }),
      createNotification('Handler only', {
        onAction: vi.fn(),
        type: 'info'
      }),
      createNotification('No action metadata')
    ]);

    const buttons = wrapper.findAll('[data-testid="button"]');

    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.attributes()).toEqual(
      expect.objectContaining({
        'data-sm': 'true',
        type: 'button'
      })
    );
    expect(buttons[0]?.text()).toBe('Retry');

    await buttons[0]?.trigger('click');

    expect(retry).toHaveBeenCalledOnce();
    expect(wrapper.text()).not.toContain('Missing handler');
  });

  it('updates when notifications change', async () => {
    const wrapper = mountNotifications([createNotification('Initial')]);

    expect(wrapper.text()).toContain('Initial');

    await wrapper.setProps({ notifications: [] });

    expect(wrapper.find('[data-testid="notifications-wrapper"]').exists()).toBe(false);

    await wrapper.setProps({
      notifications: [createNotification('Replacement', { type: 'success' })]
    });

    expect(wrapper.find('[data-testid="alert"]').attributes('data-type')).toBe('success');
    expect(wrapper.text()).toContain('Replacement');
  });
});

function createNotification(
  message: string,
  options: Partial<Notification> = {}
): Notification {
  return {
    message,
    type: 'info',
    ...options
  };
}

function mountNotifications(notifications: Notification[]) {
  return mount(SiteNotifications, {
    props: { notifications }
  });
}
