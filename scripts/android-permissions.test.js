// @vitest-environment node
import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

function run(aapt2Output) {
  return spawnSync('bash', ['scripts/android-permissions.sh'], { input: aapt2Output, encoding: 'utf8' })
}

const header = 'package: com.gibkigonzo.factorydashboard\n'
const internet = "uses-permission: name='android.permission.INTERNET'\n"
const dynamic = "uses-permission: name='com.gibkigonzo.factorydashboard.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'\n"

describe('android-permissions.sh', () => {
  it('passes and lists permissions when APK has only INTERNET', () => {
    const result = run(header + internet)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('android: uprawnienia: android.permission.INTERNET')
  })

  it('passes when APK also has the AndroidX dynamic receiver permission', () => {
    const result = run(header + internet + dynamic)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION')
  })

  it('fails and reports found permissions when APK has a permission outside the allowlist', () => {
    const result = run(header + internet + "uses-permission: name='android.permission.CAMERA'\n")
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('android.permission.INTERNET')
    expect(result.stderr).toContain('android.permission.CAMERA')
  })

  it('fails when aapt2 output has no permissions', () => {
    const result = run(header)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('znaleziono: brak')
  })
})
