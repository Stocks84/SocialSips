import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  moderationAlertEmailEnabled,
  openReportsLabel,
  reportNoun,
  reportNotificationHref,
  reportNotificationText,
} from './moderation-alert.ts'

const envOn = {
  MODERATION_ALERT_EMAIL_ENABLED: 'true',
  MODERATION_ALERT_EMAIL: 'admin@example.com',
  MODERATION_ALERT_FROM: 'Social Sips <alerts@example.com>',
  RESEND_API_KEY: 're_test',
}

describe('moderationAlertEmailEnabled', () => {
  it('is off by default, even if a Resend key and address are present', () => {
    assert.equal(moderationAlertEmailEnabled({}), false)
    assert.equal(moderationAlertEmailEnabled({ ...envOn, MODERATION_ALERT_EMAIL_ENABLED: undefined }), false)
    assert.equal(moderationAlertEmailEnabled({ ...envOn, MODERATION_ALERT_EMAIL_ENABLED: 'false' }), false)
    assert.equal(moderationAlertEmailEnabled(envOn), true)
  })
})

describe('reportNoun and openReportsLabel', () => {
  it('uses drink, not cocktail, and formats the open-count copy', () => {
    assert.equal(reportNoun('cocktail'), 'a drink')
    assert.equal(reportNoun('cocktail_variation'), 'a drink variation')
    assert.equal(reportNoun('game'), 'a game')
    assert.doesNotMatch([reportNoun('cocktail'), reportNoun('cocktail_variation')].join(' '), /cocktail/i)
    assert.equal(openReportsLabel(0), 'No open reports')
    assert.equal(openReportsLabel(1), '1 open report')
    assert.equal(openReportsLabel(3), '3 open reports')
  })
})

describe('report notification copy', () => {
  it('names the target, links to the admin queue, and never mentions the reporter', () => {
    const t = reportNotificationText('a drink')
    assert.match(t.text, /new report on a drink/i)
    assert.doesNotMatch(t.text, /sneaky|@|reporter|email|cocktail/i)
    assert.equal(
      reportNotificationHref('22222222-2222-2222-2222-222222222222'),
      '/admin/reports#report-22222222-2222-2222-2222-222222222222',
    )
  })
})
