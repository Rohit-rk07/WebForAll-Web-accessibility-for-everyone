import React, { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { Box, Typography, Paper, CircularProgress, Alert, AlertTitle, Container, useTheme, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';



/**
 * Home page component
 * Serves as the landing page with HTML upload/paste functionality
 * and displays accessibility analysis results
 */
const Home = () => {
  const [demoLoading, setDemoLoading] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const {demoLogin} = useAuth();

  const handleDemoLogin = useCallback(async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await demoLogin();
      navigate('/dashboard/home');
    } catch (e) {
      // Optional: surface an error UI if demo login fails
      console.error('Demo login failed', e);
    } finally {
      setDemoLoading(false);
    }
  }, [demoLogin, navigate, demoLoading]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Navbar />
      
      {/* Top Tagline Section */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        py: 8
      }}>
        <Box sx={{ 
          width: '100%', 
          textAlign: 'center',
          py: 3,
          px: 4,
          bgcolor: 'rgba(0,0,0,0.0)',
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0)'
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              color: theme.palette.text.secondary,
              fontWeight: 500,
              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: { xs: '1.6rem', md: '2.0rem' },
              lineHeight: 1,
              maxWidth: '1000px',
              mx: 'auto'
            }}
          >
            Analyze website accessibility with AI-powered insights{' '}
            <br />
            and recommendations for free
          </Typography>
        </Box>
      </Box>
      
      {/* Feature Boxes Section - At Top, Full Width, 2 per Row */}
      <Container maxWidth="xl" sx={{ py: 0 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 2, 
          mb: 4
        }}>
        
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              bgcolor: theme.palette.background.paper,
              background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(67, 97, 238, 0.15)',
                background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.08) 0%, rgba(67, 97, 238, 0.04) 100%)',
                border: '1px solid rgba(67, 97, 238, 0.2)',
                '& .feature-icon': {
                  transform: 'scale(1.1) rotate(5deg)',
                },
                '& .feature-title': {
                  color: theme.palette.primary.main,
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography 
                className="feature-icon"
                variant="h3" 
                sx={{ 
                  mr: 2, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 2px 4px rgba(67, 97, 238, 0.2))'
                }}
              >
                🔍
              </Typography>
              <Typography 
                className="feature-title"
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.text.primary,
                  transition: 'color 0.3s ease',
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                }}
              >
                Comprehensive Analysis
              </Typography>
            </Box>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                fontSize: '1rem',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              • Dynamic analysis using axe-core (100+ rules)\n• WCAG 2.0, 2.1, 2.2 compliance checking\n• Multiple input methods (URL, HTML file, paste)\n• Real-time JavaScript-rendered content analysis
            </Typography>
          </Paper>
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              bgcolor: theme.palette.background.paper,
              background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(67, 97, 238, 0.15)',
                background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.08) 0%, rgba(67, 97, 238, 0.04) 100%)',
                border: '1px solid rgba(67, 97, 238, 0.2)',
                '& .feature-icon': {
                  transform: 'scale(1.1) rotate(5deg)',
                },
                '& .feature-title': {
                  color: theme.palette.primary.main,
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography 
                className="feature-icon"
                variant="h3" 
                sx={{ 
                  mr: 2, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 2px 4px rgba(67, 97, 238, 0.2))'
                }}
              >
                🤖
              </Typography>
              <Typography 
                className="feature-title"
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.text.primary,
                  transition: 'color 0.3s ease',
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                }}
              >
                AI-Powered Insights
              </Typography>
            </Box>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                fontSize: '1rem',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              • Google Gemini AI explanations\n• Step-by-step fix instructions\n• Code examples and best practices\n• Interactive chatbot assistance
            </Typography>
          </Paper>
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              bgcolor: theme.palette.background.paper,
              background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(67, 97, 238, 0.15)',
                background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.08) 0%, rgba(67, 97, 238, 0.04) 100%)',
                border: '1px solid rgba(67, 97, 238, 0.2)',
                '& .feature-icon': {
                  transform: 'scale(1.1) rotate(5deg)',
                },
                '& .feature-title': {
                  color: theme.palette.primary.main,
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography 
                className="feature-icon"
                variant="h3" 
                sx={{ 
                  mr: 2, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 2px 4px rgba(67, 97, 238, 0.2))'
                }}
              >
                📊
              </Typography>
              <Typography 
                className="feature-title"
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.text.primary,
                  transition: 'color 0.3s ease',
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                }}
              >
                Detailed Reporting
              </Typography>
            </Box>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                fontSize: '1rem',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              • Accessibility scores and breakdowns\n• Severity-based issue categorization\n• PDF export with professional formatting\n• Executive summaries and recommendations
            </Typography>
          </Paper>
          
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 4, 
              bgcolor: theme.palette.background.paper,
              background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.05) 0%, rgba(67, 97, 238, 0.02) 100%)',
              border: '1px solid rgba(67, 97, 238, 0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(67, 97, 238, 0.15)',
                background: 'linear-gradient(135deg, rgba(67, 97, 238, 0.08) 0%, rgba(67, 97, 238, 0.04) 100%)',
                border: '1px solid rgba(67, 97, 238, 0.2)',
                '& .feature-icon': {
                  transform: 'scale(1.1) rotate(5deg)',
                },
                '& .feature-title': {
                  color: theme.palette.primary.main,
                }
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography 
                className="feature-icon"
                variant="h3" 
                sx={{ 
                  mr: 2, 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: 'drop-shadow(0 2px 4px rgba(67, 97, 238, 0.2))'
                }}
              >
                💾
              </Typography>
              <Typography 
                className="feature-title"
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.text.primary,
                  transition: 'color 0.3s ease',
                  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                }}
              >
                History & Tracking
              </Typography>
            </Box>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                whiteSpace: 'pre-line',
                lineHeight: 1.6,
                fontSize: '1rem',
                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
              }}
            >
              • Save and organize analysis results\n• Track improvements over time\n• Compare different versions\n• Quick access to previous reports
            </Typography>
          </Paper>
        </Box>
        
        {/* Big Demo User Button */}
        <Box sx={{ 
          textAlign: 'center',
          mb: 4
        }}>
            <Button 
              variant="contained" 
              size="large"
              disabled={demoLoading}
              sx={{ 
                bgcolor: theme.palette.primary.main,
                color: 'white',
                px: 6, 
                py: 2,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                textTransform: 'none',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(67, 97, 238, 0.3)',
                '&:hover': {
                  bgcolor: theme.palette.primary.dark,
                  boxShadow: '0 6px 16px rgba(67, 97, 238, 0.4)'
                }
              }}
              onClick={handleDemoLogin}
            >
              {demoLoading ? <CircularProgress size={22} color="inherit" /> : 'Continue as Demo User'}
            </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
