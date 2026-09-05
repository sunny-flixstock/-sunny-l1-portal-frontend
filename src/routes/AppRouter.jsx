import { Route, Routes } from 'react-router-dom'
import { PrivateLayout } from '../layouts/PrivateLayout.jsx'
import { ClientsPage } from '../pages/ClientsPage.jsx'
import { FrameworkGroupsPage } from '../pages/FrameworkGroupsPage.jsx'
import { FrameworkVersionsPage } from '../pages/FrameworkVersionsPage.jsx'
import { L1FeedbackPage } from '../pages/L1FeedbackPage.jsx'
import { FrameworkVocabPage } from '../pages/FrameworkVocabPage.jsx'
import { CategoryRegistryPage } from '../pages/CategoryRegistryPage.jsx'
import { SupportingItemsPage } from '../pages/SupportingItemsPage.jsx'
import { SupportingItemsUploadPage } from '../pages/SupportingItemsUploadPage.jsx'
import { SupportingItemsClientPage } from '../pages/SupportingItemsClientPage.jsx'
import { AnglesPage } from '../pages/AnglesPage.jsx'
import { AngleTechnicalSpecificationsPage } from '../pages/AngleTechnicalSpecificationsPage.jsx'
import { ExampleImagesPage } from '../pages/ExampleImagesPage.jsx'
import { InputSetsPage } from '../pages/InputSetsPage.jsx'
import { CreateInputSetPage } from '../pages/CreateInputSetPage.jsx'
import { ViewInputSetPage } from '../pages/ViewInputSetPage.jsx'
import { EditInputSetPage } from '../pages/EditInputSetPage.jsx'
import { CloneInputSetPage } from '../pages/CloneInputSetPage.jsx'
import { RulesPage } from '../pages/RulesPage.jsx'
import { SystemInstructionsLibraryPage } from '../pages/SystemInstructionsLibraryPage.jsx'
import { SystemInstructionsTypePage } from '../pages/SystemInstructionsTypePage.jsx'
import { ViewSystemInstructionPage } from '../pages/ViewSystemInstructionPage.jsx'
import { DashboardPage } from '../pages/DashboardPage.jsx'
import { LoginPage } from '../pages/LoginPage.jsx'
import { ProtectedRoute } from './ProtectedRoute.jsx'
import { PublicRoute } from './PublicRoute.jsx'
import { RootRedirect } from './RootRedirect.jsx'
import { ApiDocsPage } from '../pages/ApiDocsPage.jsx'

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/framework-groups" element={<FrameworkGroupsPage />} />
          <Route path="/framework-versions" element={<FrameworkVersionsPage />} />
          <Route path="/l1-feedback" element={<L1FeedbackPage />} />
          <Route path="/framework-vocab" element={<FrameworkVocabPage />} />
          <Route path="/category-registry" element={<CategoryRegistryPage />} />
          <Route path="/supporting-items" element={<SupportingItemsPage />} />
          <Route path="/supporting-items/upload" element={<SupportingItemsUploadPage />} />
          <Route path="/supporting-items/:clientCode" element={<SupportingItemsClientPage />} />
          <Route path="/angles" element={<AnglesPage />} />
          <Route
            path="/angle-technical-specifications"
            element={<AngleTechnicalSpecificationsPage />}
          />
          <Route path="/rules" element={<RulesPage />} />
          <Route
            path="/system-instructions"
            element={<SystemInstructionsLibraryPage />}
          />
          <Route
            path="/system-instructions/:instructionType"
            element={<SystemInstructionsTypePage />}
          />
          <Route
            path="/system-instructions/:instructionType/:id"
            element={<ViewSystemInstructionPage />}
          />
          <Route path="/example-images" element={<ExampleImagesPage />} />
          <Route path="/input-sets" element={<InputSetsPage />} />
          <Route path="/input-sets/new" element={<CreateInputSetPage />} />
          <Route path="/input-sets/:id/clone" element={<CloneInputSetPage />} />
          <Route path="/input-sets/:id/edit" element={<EditInputSetPage />} />
          <Route path="/input-sets/:id" element={<ViewInputSetPage />} />
          <Route path="/api-docs" element={<ApiDocsPage />} />
          <Route path="/api-docs/:docName" element={<ApiDocsPage />} />
        </Route>
      </Route>

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}
