/**
 * End-to-End Complete Workflow Test
 * Tests the entire customer and work order management workflow from UI to database
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test configuration
const TEST_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'
const TEST_TIMEOUT = 60000

// Mock user credentials for testing
const ADMIN_USER = {
  email: 'admin@fisherbackflows.com',
  password: 'TestPassword123!',
  name: 'Test Admin User'
}

const CUSTOMER_USER = {
  email: 'customer.test@example.com',
  password: 'CustomerTest123!',
  name: 'Test Customer',
  phone: '(555) 123-4567',
  address: '123 Test Street, Test City, WA, 98101'
}

test.describe('Complete Business Workflow', () => {
  let context: BrowserContext
  let adminPage: Page
  let customerPage: Page

  test.beforeAll(async ({ browser }) => {
    // Create browser context with authentication state
    context = await browser.newContext({
      // Set reasonable viewport for desktop testing
      viewport: { width: 1280, height: 720 },
      // Enable request/response logging for debugging
      recordVideo: { dir: 'test-results/videos/' }
    })

    // Create pages for different user roles
    adminPage = await context.newPage()
    customerPage = await context.newPage()

    // Set longer timeout for this test suite
    test.setTimeout(TEST_TIMEOUT * 5)
  })

  test.afterAll(async () => {
    await adminPage?.close()
    await customerPage?.close()
    await context?.close()
  })

  test('Complete customer onboarding to work order completion workflow', async () => {
    // Step 1: Customer Registration
    await test.step('Customer registers for account', async () => {
      await customerPage.goto(`${TEST_BASE_URL}/portal/register`)
      
      // Wait for registration form to load
      await expect(customerPage.locator('h1')).toContainText(/register|sign up/i)
      
      // Fill out registration form
      await customerPage.fill('input[name="name"]', CUSTOMER_USER.name)
      await customerPage.fill('input[name="email"]', CUSTOMER_USER.email)
      await customerPage.fill('input[name="password"]', CUSTOMER_USER.password)
      await customerPage.fill('input[name="phone"]', CUSTOMER_USER.phone)
      
      // Submit registration
      await customerPage.click('button[type="submit"]')
      
      // Verify registration success (might redirect or show success message)
      await expect(customerPage).toHaveURL(/\/portal\/dashboard|\/portal\/verify/, { timeout: 10000 })
    })

    // Step 2: Admin creates work order for customer
    await test.step('Admin creates work order for customer', async () => {
      await adminPage.goto(`${TEST_BASE_URL}/team-portal/login`)
      
      // Admin login
      await expect(adminPage.locator('h1')).toContainText(/login|sign in/i)
      await adminPage.fill('input[name="email"]', ADMIN_USER.email)
      await adminPage.fill('input[name="password"]', ADMIN_USER.password)
      await adminPage.click('button[type="submit"]')
      
      // Navigate to work orders
      await expect(adminPage).toHaveURL(/\/team-portal\/dashboard/, { timeout: 10000 })
      await adminPage.click('a[href*="work-orders"], nav >> text=Work Orders')
      
      // Create new work order
      await adminPage.click('button:has-text("New Work Order"), a:has-text("Create")')
      
      // Fill work order form
      await adminPage.fill('input[name="title"]', 'Annual Backflow Test - E2E Test')
      await adminPage.fill('textarea[name="description"]', 'End-to-end test work order for backflow prevention device testing')
      
      // Select customer (search for the test customer)
      await adminPage.fill('input[placeholder*="customer"], input[name="customer"]', CUSTOMER_USER.email)
      await adminPage.click(`text=${CUSTOMER_USER.name}`, { timeout: 5000 })
      
      // Set priority and schedule
      await adminPage.selectOption('select[name="priority"]', 'high')
      
      // Set future date for scheduling
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const dateString = futureDate.toISOString().split('T')[0]
      await adminPage.fill('input[type="date"], input[name="scheduled_at"]', dateString)
      
      // Submit work order
      await adminPage.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
      
      // Verify work order was created
      await expect(adminPage.locator('text=Work order created')).toBeVisible({ timeout: 5000 })
      await expect(adminPage.locator('text=Annual Backflow Test - E2E Test')).toBeVisible()
    })

    // Step 3: Customer views work order in portal
    await test.step('Customer views work order in portal', async () => {
      await customerPage.goto(`${TEST_BASE_URL}/portal/dashboard`)
      
      // Customer should see work order in their dashboard
      await expect(customerPage.locator('text=Annual Backflow Test - E2E Test')).toBeVisible({ timeout: 10000 })
      
      // Click to view work order details
      await customerPage.click('text=Annual Backflow Test - E2E Test')
      
      // Verify work order details are displayed
      await expect(customerPage.locator('text=End-to-end test work order')).toBeVisible()
      await expect(customerPage.locator('text=High Priority, text=Scheduled')).toBeVisible()
    })

    // Step 4: Admin assigns inspector and updates status
    await test.step('Admin assigns inspector and starts work order', async () => {
      // Go back to admin page and update work order
      await adminPage.click('text=Annual Backflow Test - E2E Test')
      await adminPage.click('button:has-text("Edit"), a:has-text("Edit")')
      
      // Assign inspector and update status
      await adminPage.selectOption('select[name="assigned_to"]', { index: 1 }) // Select first available inspector
      await adminPage.selectOption('select[name="status"]', 'in_progress')
      
      // Add special instructions
      await adminPage.fill('textarea[name="special_instructions"]', 'Test instructions: Access through main entrance. Contact customer before arrival.')
      
      // Save changes
      await adminPage.click('button[type="submit"]:has-text("Update"), button:has-text("Save")')
      
      // Verify status update
      await expect(adminPage.locator('text=In Progress')).toBeVisible()
    })

    // Step 5: Create inspection record
    await test.step('Inspector creates inspection record', async () => {
      // Navigate to inspections from work order
      await adminPage.click('button:has-text("Add Inspection"), a:has-text("Create Inspection")')
      
      // Fill inspection form
      await adminPage.fill('input[name="device_type"]', 'Reduced Pressure Backflow Assembly')
      await adminPage.fill('input[name="device_serial"]', 'RPZ-E2E-TEST-12345')
      
      // Add test data (JSON or form fields depending on implementation)
      await adminPage.fill('textarea[name="notes"]', 'E2E Test: Device tested successfully. All parameters within specifications.')
      
      // Submit inspection
      await adminPage.click('button[type="submit"]:has-text("Create"), button:has-text("Save")')
      
      // Verify inspection created
      await expect(adminPage.locator('text=Inspection created')).toBeVisible({ timeout: 5000 })
    })

    // Step 6: Submit and approve inspection
    await test.step('Submit and approve inspection', async () => {
      // Submit inspection for approval
      await adminPage.click('button:has-text("Submit for Approval")')
      
      // Approve inspection (as admin)
      await adminPage.click('button:has-text("Approve")')
      
      // Add approval notes
      await adminPage.fill('textarea[name="approval_notes"]', 'E2E Test: Inspection approved. All requirements met.')
      await adminPage.click('button[type="submit"]:has-text("Approve")')
      
      // Verify approval
      await expect(adminPage.locator('text=Inspection approved')).toBeVisible()
    })

    // Step 7: Complete work order
    await test.step('Complete work order', async () => {
      // Navigate back to work order and mark complete
      await adminPage.click('a:has-text("Work Order"), button:has-text("Back to Work Order")')
      await adminPage.click('button:has-text("Complete Work Order")')
      
      // Confirm completion
      await adminPage.click('button:has-text("Yes"), button:has-text("Confirm")')
      
      // Verify completion
      await expect(adminPage.locator('text=Completed')).toBeVisible()
    })

    // Step 8: Customer receives completion notification
    await test.step('Customer sees completed work order', async () => {
      await customerPage.reload()
      
      // Work order should now show as completed
      await expect(customerPage.locator('text=Completed')).toBeVisible({ timeout: 10000 })
      
      // Customer can view inspection report
      await customerPage.click('text=View Report, text=Inspection Report')
      
      // Verify report details are accessible
      await expect(customerPage.locator('text=Reduced Pressure Backflow Assembly')).toBeVisible()
      await expect(customerPage.locator('text=RPZ-E2E-TEST-12345')).toBeVisible()
    })

    // Step 9: Generate and download PDF report
    await test.step('Generate and download inspection report', async () => {
      // Trigger PDF generation
      await customerPage.click('button:has-text("Download PDF"), a:has-text("Download Report")')
      
      // Wait for PDF generation (this might take a moment)
      const downloadPromise = customerPage.waitForEvent('download', { timeout: 30000 })
      const download = await downloadPromise
      
      // Verify PDF was downloaded
      expect(download.suggestedFilename()).toContain('inspection-report')
      expect(download.suggestedFilename()).toContain('.pdf')
      
      // Save the PDF for verification
      await download.saveAs(`test-results/inspection-report-${Date.now()}.pdf`)
    })
  })

  test('Error handling and edge cases', async () => {
    await test.step('Handle invalid form submissions', async () => {
      await customerPage.goto(`${TEST_BASE_URL}/portal/register`)
      
      // Try to submit empty form
      await customerPage.click('button[type="submit"]')
      
      // Verify validation errors are shown
      await expect(customerPage.locator('text=required, text=Please fill')).toBeVisible()
    })

    await test.step('Handle network errors gracefully', async () => {
      // Intercept API calls and simulate network error
      await customerPage.route('**/api/**', route => {
        route.abort('failed')
      })
      
      await customerPage.goto(`${TEST_BASE_URL}/portal/dashboard`)
      
      // Verify error handling UI
      await expect(customerPage.locator('text=Error, text=Unable to load')).toBeVisible({ timeout: 10000 })
    })
  })

  test('Performance and accessibility checks', async () => {
    await test.step('Check page load performance', async () => {
      const startTime = Date.now()
      
      await customerPage.goto(`${TEST_BASE_URL}/portal/dashboard`)
      await expect(customerPage.locator('h1, main')).toBeVisible()
      
      const loadTime = Date.now() - startTime
      
      // Page should load within reasonable time
      expect(loadTime).toBeLessThan(5000)
    })

    await test.step('Basic accessibility checks', async () => {
      await customerPage.goto(`${TEST_BASE_URL}/portal/dashboard`)
      
      // Check for basic accessibility features
      await expect(customerPage.locator('main')).toBeVisible()
      await expect(customerPage.locator('h1')).toBeVisible()
      
      // Verify navigation is keyboard accessible
      await customerPage.keyboard.press('Tab')
      const focusedElement = await customerPage.locator(':focus').first()
      expect(focusedElement).toBeVisible()
    })
  })

  test('Mobile responsive behavior', async () => {
    await test.step('Test mobile viewport', async () => {
      // Set mobile viewport
      await customerPage.setViewportSize({ width: 375, height: 667 })
      
      await customerPage.goto(`${TEST_BASE_URL}/portal/dashboard`)
      
      // Verify mobile navigation works
      await expect(customerPage.locator('button[aria-label="Menu"], .mobile-menu')).toBeVisible()
      
      // Test mobile form interactions
      await customerPage.fill('input[name="search"]', 'test search')
      await expect(customerPage.locator('input[name="search"]')).toHaveValue('test search')
    })
  })

  test('Data consistency across sessions', async () => {
    await test.step('Verify data persists across browser sessions', async () => {
      // Create data in one session
      await adminPage.goto(`${TEST_BASE_URL}/team-portal/customers`)
      await adminPage.click('button:has-text("Add Customer")')
      
      const testCustomerName = `E2E Session Test ${Date.now()}`
      await adminPage.fill('input[name="name"]', testCustomerName)
      await adminPage.fill('input[name="email"]', `session.test.${Date.now()}@example.com`)
      await adminPage.click('button[type="submit"]')
      
      // Create new page (simulating new session)
      const newSessionPage = await context.newPage()
      await newSessionPage.goto(`${TEST_BASE_URL}/team-portal/customers`)
      
      // Verify data persists
      await expect(newSessionPage.locator(`text=${testCustomerName}`)).toBeVisible({ timeout: 10000 })
      
      await newSessionPage.close()
    })
  })
})