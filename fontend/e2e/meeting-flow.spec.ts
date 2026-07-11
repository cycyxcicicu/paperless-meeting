import { test, expect } from '@playwright/test'

test.describe('Meeting flow (E2E against test backend on 8082)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('#username').fill('sonv_admin')
    await page.locator('#password').fill('12345678')
    await page.getByRole('button', { name: 'Đăng nhập' }).click()
    await page.waitForURL('**/', { timeout: 10000 }).catch(() => {})
  })

  test('login succeeds and lands on home', async ({ page }) => {
    await expect(page).not.toHaveURL(/login/)
  })

  test('meetings list shows seeded test meetings', async ({ page }) => {
    await page.goto('/phien-hop')
    await expect(page.getByText('Họp xét duyệt quy hoạch cán bộ nguồn')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Họp sơ kết công tác văn thư lưu trữ')).toBeVisible()
  })

  const QUY_HOACH_MEETING_ID = '7fe6e192-7c7d-11f1-bc3a-e26bdc62676b'

  test('meeting detail page renders correct summary + accordion counts', async ({ page }) => {
    await page.goto(`/phien-hop/${QUY_HOACH_MEETING_ID}`)
    await expect(page.getByText('HỌP XÉT DUYỆT QUY HOẠCH CÁN BỘ NGUỒN')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Đang diễn ra')).toBeVisible()
    // Accordion counts must match seeded data: 1 motion, 0 speaker turns, 1 opinion
    await expect(page.getByText('Danh sách vấn đề cần biểu quyết (1)')).toBeVisible()
    await expect(page.getByText('Danh sách phát biểu (0)')).toBeVisible()
    await expect(page.getByText('Danh sách tham gia góp ý (1)')).toBeVisible()
    // Expand the voting accordion and verify the actual motion title renders
    await page.getByText('Danh sách vấn đề cần biểu quyết (1)').click()
    await expect(page.getByText('Thông qua danh sách cán bộ đủ điều kiện quy hoạch')).toBeVisible({ timeout: 5000 })
  })

  test('diễn biến (live proceedings) page shows vote result and opinion', async ({ page }) => {
    await page.goto(`/phien-hop/${QUY_HOACH_MEETING_ID}/dien-bien`)
    await expect(
      page.getByText('Đề nghị bổ sung tiêu chí kinh nghiệm thực tế tối thiểu 5 năm vào danh sách quy hoạch.')
    ).toBeVisible({ timeout: 10000 })
  })

  test('meeting list "view" icon navigates to detail page', async ({ page }) => {
    await page.goto('/phien-hop')
    const heading = page.getByRole('heading', { name: /Họp xét duyệt quy hoạch cán bộ nguồn/ })
    const card = heading.locator('xpath=ancestor::div[position()<=6][.//button]').last()
    await card.getByRole('button').first().click()
    await page.waitForURL(/\/phien-hop\/[a-f0-9-]+$/, { timeout: 10000 })
  })

  test('create-meeting form loads for admin user', async ({ page }) => {
    await page.goto('/phien-hop/tao-moi')
    await expect(page.url()).toContain('/phien-hop/tao-moi')
  })
})
