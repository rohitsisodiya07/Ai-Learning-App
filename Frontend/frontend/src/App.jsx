import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Signup from "./Pages/Signup";
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";

import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import AppLayout from "./Components/Layout/AppLayout";

import DashboardPage from "./Pages/Dashboard/DashboardPage";

import DocumentListPage from "./Pages/Documents/DocumentListPage";
import DocumentDetailPage from "./Pages/Documents/DocumentDetailPage";

import FlashCardListPage from "./Pages/FlashCards/FlashCardListPage";
import FlashCardPage from "./Pages/FlashCards/FlashCardPage";

import ProfilePage from "./Pages/Profile/ProfilePage";

import NotFoundPage from "./Pages/NotFoundPage";

import QuizTakePage from "./Components/Quizzes/QuizTakePage";
import QuizResultPage from "./Components/Quizzes/QuizResultPage";

function App() {
  return (
    <BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />

      <Routes>

        {/* ================= PUBLIC ROUTES ================= */}

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/forgot"
          element={<ForgotPassword />}
        />


        {/* ================= PROTECTED ROUTES ================= */}

        <Route element={<ProtectedRoute />}>

          {/* ================= APP LAYOUT ================= */}

          <Route element={<AppLayout />}>

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={<DashboardPage />}
            />


            {/* ================= DOCUMENTS ================= */}

            <Route
              path="/documents"
              element={<DocumentListPage />}
            />

            <Route
              path="/documents/:id"
              element={<DocumentDetailPage />}
            />


            {/* ================= FLASHCARDS ================= */}

            {/* Flashcard Sets List */}
            <Route
              path="/flashcards"
              element={<FlashCardListPage />}
            />

            {/* Study Now */}
            <Route
              path="/documents/:documentId/flashcards"
              element={<FlashCardPage />}
            />


            {/* ================= QUIZZES ================= */}

            <Route
              path="/quiz/:quizId"
              element={<QuizTakePage />}
            />

            <Route
              path="/quiz/:quizId/results"
              element={<QuizResultPage />}
            />


            {/* ================= PROFILE ================= */}

            <Route
              path="/profile"
              element={<ProfilePage />}
            />

          </Route>

        </Route>


        {/* ================= 404 ================= */}

        <Route
          path="*"
          element={<NotFoundPage />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;