import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Switch,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Alert,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Upload as UploadIcon,
  LightMode,
  DarkMode,
  Close,
} from "@mui/icons-material";
import axios from "axios";

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTips, setShowTips] = useState(true);

  // Global theme configuration
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: { main: "#3f51b5" },
          secondary: { main: "#f50057" },
          background: {
            default: darkMode ? "#121212" : "#f5f5f5",
            paper: darkMode ? "#1e1e1e" : "#ffffff",
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: darkMode ? "#121212" : "#f5f5f5",
                transition: "background-color 0.3s ease",
                minHeight: "100vh",
                margin: 0,
                padding: 0,
              },
            },
          },
        },
      }),
    [darkMode]
  );

  const handleFileChange = (e) => setResumeFile(e.target.files[0]);
  const toggleDarkMode = () => setDarkMode(!darkMode);

  const analyzeResume = async () => {
    if (!resumeFile || !jobDescription.trim()) {
      setError("Please upload a resume and enter a job description");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescription);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5001";
      const response = await axios.post(`${apiUrl}/api/analyze`, formData);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header with theme toggle */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
            backgroundColor: theme.palette.background.paper,
            backdropFilter: "blur(10px)",
            p: 2,
            borderRadius: 2,
            position: "sticky",
            top: 0,
            zIndex: 1000,
            boxShadow: theme.shadows[1],
          }}
        >
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            ATS Resume Checker
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {darkMode ? (
              <DarkMode color="primary" />
            ) : (
              <LightMode color="primary" />
            )}
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              color="primary"
            />
          </Box>
        </Box>

        {/* Upload Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="text.primary">
            Upload Your Resume
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
            >
              Choose File
              <input
                type="file"
                hidden
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />
            </Button>
            <Typography color="text.primary">
              {resumeFile ? resumeFile.name : "No file selected"}
            </Typography>
          </Box>

          {/* Job Description Section */}
          <Typography variant="h6" gutterBottom color="text.primary">
            Job Description
          </Typography>

          <Collapse in={showTips}>
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <IconButton size="small" onClick={() => setShowTips(false)}>
                  <Close fontSize="inherit" />
                </IconButton>
              }
            >
              <Typography variant="body2">
                <strong>Tips for better results:</strong>
                <ul style={{ marginTop: 4, marginBottom: 4, paddingLeft: 20 }}>
                  <li>Include specific skills mentioned in the job posting</li>
                  <li>Copy the full job description for best analysis</li>
                  <li>Highlight key requirements and qualifications</li>
                </ul>
              </Typography>
            </Alert>
          </Collapse>

          <TextField
            label="Paste Job Description Here"
            multiline
            rows={6}
            fullWidth
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            sx={{ mb: 2 }}
            InputLabelProps={{
              style: { color: theme.palette.text.primary },
            }}
            inputProps={{
              style: { color: theme.palette.text.primary },
            }}
          />

          <Button
            variant="contained"
            size="large"
            onClick={analyzeResume}
            disabled={loading}
            sx={{ width: "100%", py: 1.5 }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Analyze Resume"
            )}
          </Button>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Paper>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography
                  variant="h5"
                  gutterBottom
                  fontWeight="bold"
                  color="text.primary"
                >
                  Analysis Results
                </Typography>

                {/* Score */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="text.primary">
                    ATS Compatibility Score: {result.score}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={result.score}
                    sx={{
                      height: 10,
                      mb: 2,
                      backgroundColor:
                        result.score >= 80
                          ? "success.light"
                          : result.score >= 50
                          ? "warning.light"
                          : "error.light",
                    }}
                  />
                  <Typography color="text.primary">
                    {result.score >= 80
                      ? "✅ Excellent! Your resume is ATS-friendly."
                      : result.score >= 50
                      ? "⚠️ Good, but could be improved."
                      : "❌ Needs significant improvements to pass ATS screening."}
                  </Typography>
                </Box>

                {/* Keywords */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom color="text.primary">
                    Keyword Matches: {result.matches}/{result.totalKeywords}
                  </Typography>
                </Box>

                {/* Missing Keywords */}
                {result.missingKeywords.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom color="text.primary">
                      Missing Keywords:
                    </Typography>
                    <List dense>
                      {result.missingKeywords.map((keyword, i) => (
                        <ListItem key={i}>
                          <ListItemText
                            primary={`• ${keyword}`}
                            primaryTypographyProps={{ color: "text.primary" }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Suggestions */}
                <Box>
                  <Typography variant="h6" gutterBottom color="text.primary">
                    Suggestions:
                  </Typography>
                  <List dense>
                    {result.suggestions.map((suggestion, i) => (
                      <ListItem key={i}>
                        <ListItemText
                          primary={`• ${suggestion}`}
                          primaryTypographyProps={{ color: "text.primary" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </ThemeProvider>
  );
};

export default App;
